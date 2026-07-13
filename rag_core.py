"""Framework-agnostic RAG pipeline: PDF extraction, OCR fallback, embeddings,
vector search, and Gemini-backed generation. Used by both the legacy Streamlit
app (app.py) and the FastAPI backend (backend/).
"""
import base64
import json
import re

import fitz  # PyMuPDF
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage

PROMPT_TEMPLATE = """
Answer the question as detailed as possible using the provided context as your source of facts.

- If the question asks for a fact that is stated in the context, extract it precisely and don't get it wrong.
- If the question asks for your reasoning, opinion, comparison, or recommendation (e.g. "which is more important", "what should I focus on", "why does this matter"), you may reason using the concepts, examples, and relationships described in the context, even if the context doesn't state the opinion outright. Ground your reasoning in what the context actually says.
- Only say "answer is not available in the context" if the context has no relevant material to reason from at all — not merely because it doesn't spell out an opinion word-for-word.
- Use the previous conversation only to resolve follow-up questions (e.g. "what about page 3?").

Previous conversation:
{chat_history}

Context:
{context}

Question:
{question}

Answer:
"""

SUMMARY_PROMPT = """Summarize the following document clearly and concisely. Cover the key points, main arguments, and conclusions. Use short bullet points grouped under headings where helpful.

Document ({source}):
{text}

Summary:"""

STUDY_NOTES_PROMPT = """Create structured study notes from the following document, suitable for exam revision.
Use headings for major topics, sub-bullets for details, and bold the key terms and definitions.

Document ({source}):
{text}

Study Notes:"""

QUIZ_PROMPT = """Generate {num_questions} multiple-choice questions to test understanding of the following document.
For each question provide exactly 4 options and mark the single correct one, plus a one-line explanation.
Return STRICT JSON only — an array of objects with keys: "question", "options" (an object with keys "A","B","C","D"), "correct" (the correct letter), "explanation". No markdown fences, no commentary, only the JSON array.

Document ({source}):
{text}

JSON:"""

FLASHCARD_PROMPT = """Generate {num_cards} flashcards covering the key concepts of the following document.
Return STRICT JSON only — an array of objects with keys "front" (a term or question) and "back" (its definition or answer). No markdown fences, no commentary, only the JSON array.

Document ({source}):
{text}

JSON:"""

COMPARE_PROMPT = """Compare the two documents below. Structure your response with these headings:
1. Key Similarities
2. Key Differences
3. Points Unique to Document A
4. Points Unique to Document B
Be specific and cite concrete details from each document.

Document A ({source_a}):
{text_a}

Document B ({source_b}):
{text_b}

Comparison:"""

RESEARCH_DECOMPOSE_PROMPT = """You are a research assistant. Break the topic below into 3 to 5 focused sub-questions that would help thoroughly investigate it using the available documents.
Return STRICT JSON only — an array of strings, no markdown fences, no commentary.

Topic: {topic}

JSON:"""

RESEARCH_SYNTHESIS_PROMPT = """You are writing a research brief on the topic "{topic}".
Using the sub-question findings below (each already grounded in source documents with citations), write a cohesive, well-structured report with an introduction, thematic sections, and a conclusion.
Preserve the citation markers like (source · p.N) exactly as given, inline, next to the claims they support.

Findings:
{findings}

Research Report:"""


def generate_with_gemini(prompt, api_key, temperature=0.3):
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=temperature, google_api_key=api_key)
    return model.invoke(prompt).content


def parse_json_response(raw):
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


def strip_markdown(text):
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^>\s?", "", text, flags=re.MULTILINE)
    return text.strip()


def ocr_page_with_gemini(pdf_bytes, page_index, api_key):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pix = doc[page_index].get_pixmap(dpi=200)
    img_b64 = base64.b64encode(pix.tobytes("png")).decode()
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, google_api_key=api_key)
    message = HumanMessage(content=[
        {"type": "text", "text": "Extract all readable text from this document page exactly as it appears, including table contents. Output only the extracted text, no commentary."},
        {"type": "image_url", "image_url": f"data:image/png;base64,{img_b64}"},
    ])
    response = model.invoke([message])
    return response.content


def get_pdf_text_with_meta(filename, file_bytes, api_key=None):
    """Extract (text, source, page_number) tuples from a single PDF's raw bytes."""
    import io
    pages = []
    pdf_reader = PdfReader(io.BytesIO(file_bytes))
    ocr_needed = []
    for i, page in enumerate(pdf_reader.pages):
        page_text = page.extract_text() or ""
        if page_text.strip():
            pages.append((page_text, filename, i + 1))
        else:
            ocr_needed.append(i)

    for i in ocr_needed:
        if not api_key:
            continue
        try:
            ocr_text = ocr_page_with_gemini(file_bytes, i, api_key)
            if ocr_text.strip():
                pages.append((ocr_text, filename, i + 1))
        except Exception:
            pass
    return pages


def get_text_chunks_with_meta(pages):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    texts, metadatas = [], []
    for page_text, source, page_number in pages:
        for chunk in text_splitter.split_text(page_text):
            texts.append(chunk)
            metadatas.append({"source": source, "page": page_number})
    return texts, metadatas


def build_vector_store(text_chunks, metadatas, api_key):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
    return FAISS.from_texts(text_chunks, embedding=embeddings, metadatas=metadatas)


def format_citations(docs):
    seen = set()
    citations = []
    for doc in docs:
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page", "?")
        key = (source, page)
        if key not in seen:
            seen.add(key)
            citations.append(f"{source} · p.{page}")
    return citations


def build_chat_history_text(history, max_turns=3):
    recent = history[-max_turns:]
    if not recent:
        return "None"
    return "\n\n".join(f"Q: {q}\nA: {a}" for q, a in recent)


def is_not_found_answer(answer):
    return "answer is not available in the context" in answer.lower()


def answer_question(vector_store, question, api_key, history=None):
    docs = vector_store.similarity_search(question, k=4)
    citations = format_citations(docs)
    context = "\n\n".join(doc.page_content for doc in docs)
    chat_history = build_chat_history_text(history or [])
    prompt = PROMPT_TEMPLATE.format(chat_history=chat_history, context=context, question=question)
    answer = generate_with_gemini(prompt, api_key)
    return answer, citations, is_not_found_answer(answer)


def generate_summary(source, text, api_key):
    return generate_with_gemini(SUMMARY_PROMPT.format(source=source, text=text), api_key)


def generate_study_notes(source, text, api_key):
    return generate_with_gemini(STUDY_NOTES_PROMPT.format(source=source, text=text), api_key)


def generate_quiz(source, text, api_key, num_questions=5):
    raw = generate_with_gemini(QUIZ_PROMPT.format(num_questions=num_questions, source=source, text=text), api_key, temperature=0.4)
    return parse_json_response(raw)


def generate_flashcards(source, text, api_key, num_cards=10):
    raw = generate_with_gemini(FLASHCARD_PROMPT.format(num_cards=num_cards, source=source, text=text), api_key, temperature=0.4)
    return parse_json_response(raw)


def generate_comparison(source_a, text_a, source_b, text_b, api_key):
    prompt = COMPARE_PROMPT.format(source_a=source_a, text_a=text_a, source_b=source_b, text_b=text_b)
    return generate_with_gemini(prompt, api_key)


def generate_research_report(topic, vector_store, api_key, progress_callback=None):
    sub_questions = parse_json_response(generate_with_gemini(RESEARCH_DECOMPOSE_PROMPT.format(topic=topic), api_key, temperature=0.4))

    findings = []
    for i, sub_q in enumerate(sub_questions):
        if progress_callback:
            progress_callback(i, len(sub_questions), sub_q)
        answer, citations, _ = answer_question(vector_store, sub_q, api_key)
        citation_str = ", ".join(f"({c})" for c in citations)
        findings.append(f"Sub-question: {sub_q}\nFindings: {answer} {citation_str}")

    report = generate_with_gemini(
        RESEARCH_SYNTHESIS_PROMPT.format(topic=topic, findings="\n\n".join(findings)), api_key
    )
    return report, sub_questions


REWRITE_TEXT_PROMPT = """Rewrite the text below according to this instruction: "{instruction}"

Preserve the original meaning. Output ONLY the rewritten text — no quotes, no commentary, no explanation, and keep
it roughly the same length as the original unless the instruction requires otherwise.

Original text:
{text}

Rewritten text:"""


def rewrite_text(text, instruction, api_key):
    prompt = REWRITE_TEXT_PROMPT.format(instruction=instruction, text=text)
    result = generate_with_gemini(prompt, api_key, temperature=0.4)
    return result.strip().strip('"')


OCR_BOXES_PROMPT = """Extract every distinct line of text from this scanned document page.

Return STRICT JSON only — an array of objects with keys:
- "text": the line's text content
- "x": left edge as a fraction of page width (0 to 1)
- "y": top edge as a fraction of page height (0 to 1), measured from the TOP of the page
- "width": the line's width as a fraction of page width (0 to 1)
- "height": the line's height as a fraction of page height (0 to 1)

Estimate the bounding box of each line as accurately as you can from its position in the image. No markdown fences, no commentary, only the JSON array."""


def ocr_page_boxes(pdf_bytes, page_index, api_key):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pix = doc[page_index].get_pixmap(dpi=200)
    img_b64 = base64.b64encode(pix.tobytes("png")).decode()
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, google_api_key=api_key)
    message = HumanMessage(content=[
        {"type": "text", "text": OCR_BOXES_PROMPT},
        {"type": "image_url", "image_url": f"data:image/png;base64,{img_b64}"},
    ])
    response = model.invoke([message])
    boxes = parse_json_response(response.content)
    return [b for b in boxes if isinstance(b, dict) and b.get("text", "").strip()]


AGENT_PLAN_PROMPT = """You are a planning assistant for a document AI tool. Given the user's goal and the list of
available documents, decide which of the following actions to run, in order, to accomplish the goal.

Available actions (use ONLY these):
- "summary": produce a summary. Requires "source" (a filename from the list).
- "notes": produce structured study notes. Requires "source".
- "quiz": produce a multiple-choice quiz. Requires "source". Optional "num_questions" (default 5).
- "flashcards": produce flashcards. Requires "source". Optional "num_cards" (default 10).
- "research": produce a cited research report across all documents. Requires "topic" (a short question/topic
  derived from the goal, not a filename).

Available documents: {sources}

User's goal: "{goal}"

Return STRICT JSON only — an array of step objects, each with keys "action", "label" (a short human-readable
description of the step), and the action's required/optional params as described above. Keep it to the minimum
steps needed (usually 1-4). If the goal doesn't match any available action, return an empty array. No markdown
fences, no commentary, only the JSON array."""


def plan_agent_tasks(goal, sources, api_key):
    prompt = AGENT_PLAN_PROMPT.format(sources=", ".join(sources) or "(none uploaded)", goal=goal)
    raw = generate_with_gemini(prompt, api_key, temperature=0.2)
    steps = parse_json_response(raw)
    valid_actions = {"summary", "notes", "quiz", "flashcards", "research"}
    return [s for s in steps if isinstance(s, dict) and s.get("action") in valid_actions]
