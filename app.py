import streamlit as st
from PyPDF2 import PdfReader
import pandas as pd
import base64
import fitz  # PyMuPDF
import json
import re
from dotenv import load_dotenv

import os

from db import init_db, get_session, save_chat_message, load_chat_history, clear_chat_history
from auth import create_user, authenticate_user
from billing import (
    check_usage,
    record_usage,
    check_pdf_limit,
    upgrade_to_pro,
    get_tier_limits,
    is_feature_locked,
    count_today_actions,
    FEATURE_NAMES,
)

load_dotenv()
DEFAULT_API_KEY = os.getenv("GOOGLE_API_KEY")

# Update imports for LangChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage


from datetime import datetime

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

def build_export_markdown(title, meta, body):
    meta_lines = "\n".join(f"**{k}:** {v}" for k, v in meta.items())
    generated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return (
        f"# {title}\n\n"
        f"{meta_lines}\n"
        f"**Generated:** {generated}\n\n"
        "---\n\n"
        f"{body}\n\n"
        "---\n"
        "*Generated by Documind AI*\n"
    )

def build_quiz_markdown(source, quiz):
    lines = [
        f"# Quiz — {source}",
        "",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Total Questions:** {len(quiz)}",
        "",
        "---",
        "",
    ]
    for i, q in enumerate(quiz, 1):
        lines.append(f"### Q{i}. {q['question']}")
        lines.append("")
        for k, v in q["options"].items():
            marker = " ✅" if k == q["correct"] else ""
            lines.append(f"- **{k}.** {v}{marker}")
        lines.append("")
        lines.append(f"**Correct Answer:** {q['correct']}")
        lines.append("")
        lines.append(f"> {q.get('explanation', '')}")
        lines.append("")
        lines.append("---")
        lines.append("")
    lines.append("*Generated by Documind AI*")
    return "\n".join(lines)

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

def get_pdf_text_with_meta(pdf_docs, api_key=None):
    pages = []  # list of (text, source, page_number)
    for pdf in pdf_docs:
        pdf_bytes = pdf.getvalue()
        pdf_reader = PdfReader(pdf)
        ocr_needed = []
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append((page_text, pdf.name, i + 1))
            else:
                ocr_needed.append(i)

        if ocr_needed and api_key:
            with st.spinner(f"Running OCR on {len(ocr_needed)} image page(s) in {pdf.name}..."):
                for i in ocr_needed:
                    try:
                        ocr_text = ocr_page_with_gemini(pdf_bytes, i, api_key)
                        if ocr_text.strip():
                            pages.append((ocr_text, pdf.name, i + 1))
                    except Exception as e:
                        st.warning(f"OCR failed for {pdf.name} page {i + 1}: {e}")
    return pages

def get_text_chunks_with_meta(pages, model_name):
    if model_name == "Google AI":
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    texts, metadatas = [], []
    for page_text, source, page_number in pages:
        for chunk in text_splitter.split_text(page_text):
            texts.append(chunk)
            metadatas.append({"source": source, "page": page_number})
    return texts, metadatas

def get_vector_store(text_chunks, metadatas, model_name, api_key=None):
    if model_name == "Google AI":
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings, metadatas=metadatas)
    vector_store.save_local("faiss_index")
    return vector_store

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

def build_chat_history(conversation_history, max_turns=3):
    recent = conversation_history[-max_turns:]
    if not recent:
        return "None"
    return "\n\n".join(f"Q: {q}\nA: {a}" for q, a, *_ in recent)

def is_not_found_answer(answer):
    return "answer is not available in the context" in answer.lower()

def get_or_build_pages(pdf_docs, api_key):
    signature = tuple((f.name, f.size) for f in pdf_docs)
    if (
        st.session_state.get("pages") is not None
        and st.session_state.get("pages_signature") == signature
    ):
        return st.session_state.pages
    pages = get_pdf_text_with_meta(pdf_docs, api_key)
    st.session_state.pages = pages
    st.session_state.pages_signature = signature
    return pages

def get_document_text(pdf_docs, api_key, source_name, max_chars=30000):
    pages = get_or_build_pages(pdf_docs, api_key)
    doc_pages = sorted([(p, t) for t, s, p in pages if s == source_name])
    text = "\n\n".join(f"[Page {p}]\n{t}" for p, t in doc_pages)
    return text[:max_chars]

def get_or_build_vector_store(pdf_docs, model_name, api_key):
    signature = tuple((f.name, f.size) for f in pdf_docs)
    if (
        st.session_state.get("vector_store") is not None
        and st.session_state.get("indexed_signature") == signature
    ):
        return st.session_state.vector_store
    pages = get_or_build_pages(pdf_docs, api_key)
    text_chunks, metadatas = get_text_chunks_with_meta(pages, model_name)
    if not text_chunks:
        st.error(
            "Couldn't extract any text from the uploaded PDF(s), even after attempting OCR. "
            "The page images may be too low quality, blank, or the API key may not have vision access. "
            "Try a clearer scan or a text-based PDF."
        )
        st.stop()
    vector_store = get_vector_store(text_chunks, metadatas, model_name, api_key)
    st.session_state.vector_store = vector_store
    st.session_state.indexed_signature = signature
    return vector_store

def generate_summary(source, text, api_key):
    prompt = SUMMARY_PROMPT.format(source=source, text=text)
    return generate_with_gemini(prompt, api_key)

def generate_study_notes(source, text, api_key):
    prompt = STUDY_NOTES_PROMPT.format(source=source, text=text)
    return generate_with_gemini(prompt, api_key)

def generate_quiz(source, text, api_key, num_questions=5):
    prompt = QUIZ_PROMPT.format(num_questions=num_questions, source=source, text=text)
    raw = generate_with_gemini(prompt, api_key, temperature=0.4)
    return parse_json_response(raw)

def generate_flashcards(source, text, api_key, num_cards=10):
    prompt = FLASHCARD_PROMPT.format(num_cards=num_cards, source=source, text=text)
    raw = generate_with_gemini(prompt, api_key, temperature=0.4)
    return parse_json_response(raw)

def generate_comparison(source_a, text_a, source_b, text_b, api_key):
    prompt = COMPARE_PROMPT.format(source_a=source_a, text_a=text_a, source_b=source_b, text_b=text_b)
    return generate_with_gemini(prompt, api_key)

def generate_research_report(topic, vector_store, api_key, progress_callback=None):
    decompose_prompt = RESEARCH_DECOMPOSE_PROMPT.format(topic=topic)
    sub_questions = parse_json_response(generate_with_gemini(decompose_prompt, api_key, temperature=0.4))

    findings = []
    for i, sub_q in enumerate(sub_questions):
        if progress_callback:
            progress_callback(i, len(sub_questions), sub_q)
        docs = vector_store.similarity_search(sub_q, k=4)
        citations = format_citations(docs)
        context = "\n\n".join(doc.page_content for doc in docs)
        answer_prompt = PROMPT_TEMPLATE.format(chat_history="None", context=context, question=sub_q)
        answer = generate_with_gemini(answer_prompt, api_key)
        citation_str = ", ".join(f"({c})" for c in citations)
        findings.append(f"Sub-question: {sub_q}\nFindings: {answer} {citation_str}")

    synthesis_prompt = RESEARCH_SYNTHESIS_PROMPT.format(topic=topic, findings="\n\n".join(findings))
    report = generate_with_gemini(synthesis_prompt, api_key)
    return report, sub_questions

def user_input(user_question, model_name, api_key, pdf_docs, conversation_history, db_session=None, user_id=None):
    if api_key is None or pdf_docs is None:
        st.warning("Please upload PDF files and provide API key before processing.")
        return
    user_question_output = ""
    response_output = ""
    citations = []
    if model_name == "Google AI":
        new_db = get_or_build_vector_store(pdf_docs, model_name, api_key)
        docs = new_db.similarity_search(user_question, k=4)
        citations = format_citations(docs)
        context = "\n\n".join(doc.page_content for doc in docs)
        chat_history = build_chat_history(conversation_history)
        prompt = PROMPT_TEMPLATE.format(chat_history=chat_history, context=context, question=user_question)
        model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3, google_api_key=api_key)

        user_question_output = user_question

        st.markdown(
            f"""
            <div class="chat-message user">
                <div class="avatar">U</div>
                <div class="message">{user_question_output}</div>
            </div>
            """,
            unsafe_allow_html=True
        )
        bot_placeholder = st.empty()
        streamed_text = ""
        for chunk in model.stream(prompt):
            streamed_text += chunk.content
            bot_placeholder.markdown(
                f"""
                <div class="chat-message bot">
                    <div class="avatar">AI</div>
                    <div class="message">{streamed_text}▌</div>
                </div>
                """,
                unsafe_allow_html=True
            )
        response_output = streamed_text
        not_found = is_not_found_answer(response_output)
        bot_class = "bot not-found" if not_found else "bot"
        badge_html = '<div class="not-found-badge">⚠ Not in document</div>' if not_found else ""
        citations_html = "" if not_found else "".join(f'<span class="citation-pill">{c}</span>' for c in citations)
        bot_placeholder.markdown(
            f"""
            <div class="chat-message {bot_class}">
                <div class="avatar">AI</div>
                <div class="message">{badge_html}{response_output}
                    <div class="citations">{citations_html}</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        pdf_names = [pdf.name for pdf in pdf_docs] if pdf_docs else []
        pdf_names_str = ", ".join(pdf_names)
        citations_str = "; ".join(citations)
        conversation_history.append((
            user_question_output,
            response_output,
            model_name,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            pdf_names_str,
            citations_str,
        ))

        if db_session is not None and user_id is not None:
            save_chat_message(db_session, user_id, user_question_output, response_output, citations_str, pdf_names_str)

    if len(conversation_history) == 1:
        conversation_history = []
    elif len(conversation_history) > 1 :
        last_item = conversation_history[-1]
        conversation_history.remove(last_item)
    for question, answer, model_name, timestamp, pdf_name, citation_str in reversed(conversation_history):
        not_found = is_not_found_answer(answer)
        bot_class = "bot not-found" if not_found else "bot"
        badge_html = '<div class="not-found-badge">⚠ Not in document</div>' if not_found else ""
        citations_html = "" if not_found else "".join(f'<span class="citation-pill">{c}</span>' for c in citation_str.split("; ") if c)
        st.markdown(
            f"""
            <div class="chat-message user">
                <div class="avatar">U</div>
                <div class="message">{question}</div>
            </div>
            <div class="chat-message {bot_class}">
                <div class="avatar">AI</div>
                <div class="message">{badge_html}{answer}
                    <div class="citations">{citations_html}</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    if len(st.session_state.conversation_history) > 0:
        df = pd.DataFrame(st.session_state.conversation_history, columns=["Question", "Answer", "Model", "Timestamp", "PDF Name", "Citations"])
        csv = df.to_csv(index=False)
        b64 = base64.b64encode(csv.encode()).decode()  # Convert to base64
        href = f'<a href="data:file/csv;base64,{b64}" download="conversation_history.csv" class="download-link">⬇ Download conversation history (CSV)</a>'
        st.sidebar.markdown(href, unsafe_allow_html=True)

def inject_custom_css():
    st.markdown(
        """
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            html, body, [class*="css"]  {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            :root {
                --accent: #4f6df5;
                --accent-dark: #3b52c4;
                --surface: rgba(255,255,255,0.03);
                --border: rgba(255,255,255,0.08);
            }

            .stApp {
                background: radial-gradient(circle at top left, #0f1420 0%, #0a0e17 55%, #05070c 100%);
            }

            /* Header */
            .app-header {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 1.25rem 1.5rem;
                margin-bottom: 1.5rem;
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(79,109,245,0.15), rgba(79,109,245,0.03));
                border: 1px solid var(--border);
            }
            .app-header .icon {
                font-size: 2rem;
            }
            .app-logo {
                height: 48px;
                width: auto;
                flex-shrink: 0;
            }
            .app-header .titles h1 {
                font-size: 1.4rem;
                font-weight: 700;
                margin: 0;
                color: #f5f7ff;
            }
            .app-header .titles p {
                margin: 0;
                font-size: 0.85rem;
                color: #9aa3b8;
            }

            /* Sidebar */
            section[data-testid="stSidebar"] {
                background: #0b0f1a;
                border-right: 1px solid var(--border);
            }
            section[data-testid="stSidebar"] .block-container {
                padding-top: 1.5rem;
            }
            .sidebar-section-title {
                font-size: 0.75rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #6b7385;
                font-weight: 600;
                margin: 1.2rem 0 0.5rem 0;
            }
            .badge-row {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 0.5rem;
            }

            /* Cards / containers */
            div[data-testid="stFileUploader"] {
                border: 1px dashed var(--border);
                border-radius: 10px;
                padding: 0.5rem;
                background: var(--surface);
            }

            /* Buttons */
            .stButton > button {
                background: var(--accent);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                padding: 0.5rem 1rem;
                transition: background 0.15s ease;
            }
            .stButton > button:hover {
                background: var(--accent-dark);
                color: white;
            }

            /* Text inputs */
            .stTextInput > div > div > input {
                border-radius: 8px;
                border: 1px solid var(--border);
                background: var(--surface);
                color: #f5f7ff;
            }

            /* Chat bubbles */
            .chat-message {
                padding: 1.1rem 1.3rem;
                border-radius: 12px;
                margin-bottom: 0.9rem;
                display: flex;
                gap: 12px;
                align-items: flex-start;
                border: 1px solid var(--border);
            }
            .chat-message.user {
                background: rgba(79,109,245,0.08);
            }
            .chat-message.bot {
                background: rgba(255,255,255,0.03);
            }
            .chat-message .avatar {
                flex-shrink: 0;
                width: 34px;
                height: 34px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 700;
                color: white;
            }
            .chat-message.user .avatar { background: var(--accent); }
            .chat-message.bot .avatar { background: #2a2f3d; }
            .chat-message .message {
                color: #e7eaf2;
                font-size: 0.95rem;
                line-height: 1.55;
                white-space: pre-wrap;
            }

            /* Download link styled as button */
            .download-link {
                display: inline-block;
                width: 100%;
                text-align: center;
                background: var(--accent);
                color: white !important;
                padding: 0.5rem 0.9rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.85rem;
                text-decoration: none !important;
                margin-top: 0.5rem;
            }
            .download-link:hover {
                background: var(--accent-dark);
            }

            /* Footer socials */
            .social-badges img { border-radius: 4px; }

            /* Citations */
            .citations {
                margin-top: 0.6rem;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .citation-pill {
                font-size: 0.72rem;
                font-weight: 500;
                color: #a9b3ce;
                background: rgba(79,109,245,0.12);
                border: 1px solid rgba(79,109,245,0.3);
                border-radius: 999px;
                padding: 2px 10px;
            }

            /* Not-found answers */
            .chat-message.bot.not-found {
                background: rgba(245, 158, 11, 0.08);
                border-color: rgba(245, 158, 11, 0.3);
            }
            .chat-message.bot.not-found .avatar {
                background: #b45309;
            }
            .not-found-badge {
                display: inline-block;
                font-size: 0.72rem;
                font-weight: 600;
                color: #fbbf24;
                background: rgba(245, 158, 11, 0.12);
                border: 1px solid rgba(245, 158, 11, 0.35);
                border-radius: 6px;
                padding: 2px 8px;
                margin-bottom: 0.5rem;
            }

            /* Tabs */
            .stTabs [data-baseweb="tab-list"] {
                gap: 4px;
            }
            .stTabs [data-baseweb="tab"] {
                border-radius: 8px 8px 0 0;
                color: #9aa3b8;
            }

            /* Feature output card */
            .feature-card {
                padding: 1.25rem 1.5rem;
                border-radius: 12px;
                border: 1px solid var(--border);
                background: rgba(255,255,255,0.03);
                color: #e7eaf2;
                line-height: 1.6;
                white-space: pre-wrap;
                margin-top: 0.75rem;
            }

            /* Quiz */
            .quiz-question {
                font-weight: 600;
                color: #f5f7ff;
                margin-bottom: 0.4rem;
            }
            .quiz-explanation {
                font-size: 0.85rem;
                color: #9aa3b8;
                margin-top: 0.4rem;
            }
            .quiz-correct { color: #34d399; font-weight: 600; }
            .quiz-incorrect { color: #f87171; font-weight: 600; }

            /* Flashcard */
            .flashcard {
                min-height: 160px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: linear-gradient(135deg, rgba(79,109,245,0.1), rgba(79,109,245,0.02));
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 1.5rem;
                font-size: 1.05rem;
                color: #f5f7ff;
            }
            .flashcard-label {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #6b7385;
                margin-bottom: 0.5rem;
            }

            /* Account panel */
            .account-card {
                padding: 0.75rem 1rem;
                border-radius: 10px;
                background: var(--surface);
                border: 1px solid var(--border);
                margin-bottom: 0.5rem;
            }
            .account-name {
                font-weight: 600;
                color: #f5f7ff;
                margin-bottom: 0.35rem;
            }
            .tier-badge {
                display: inline-block;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                padding: 2px 10px;
                border-radius: 999px;
            }
            .tier-badge.tier-free {
                color: #9aa3b8;
                background: rgba(255,255,255,0.06);
                border: 1px solid var(--border);
            }
            .tier-badge.tier-pro {
                color: #0b0f1a;
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
            }
        </style>
        """,
        unsafe_allow_html=True
    )

LOGO_PATH = os.path.join(os.path.dirname(__file__), "assets", "logo.png")

def get_logo_base64():
    if not os.path.exists(LOGO_PATH):
        return None
    with open(LOGO_PATH, "rb") as f:
        return base64.b64encode(f.read()).decode()

def render_auth_screen():
    logo_b64 = get_logo_base64()
    logo_html = f'<img src="data:image/png;base64,{logo_b64}" class="app-logo" />' if logo_b64 else '<div class="icon">📚</div>'
    st.markdown(
        f"""
        <div class="app-header">
            {logo_html}
            <div class="titles">
                <p>Sign in to access your documents, chat history, and study tools</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    col_l, col_mid, col_r = st.columns([1, 2, 1])
    with col_mid:
        login_tab, signup_tab = st.tabs(["Log In", "Sign Up"])

        with login_tab:
            with st.form("login_form"):
                username = st.text_input("Username")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Log In", use_container_width=True)
            if submitted:
                db_session = get_session()
                user = authenticate_user(db_session, username, password)
                if user is None:
                    st.error("Invalid username or password.")
                else:
                    st.session_state.user = {"id": user.id, "username": user.username, "email": user.email, "tier": user.tier}
                    st.session_state.conversation_history = load_chat_history(db_session, user.id)
                    st.rerun()

        with signup_tab:
            with st.form("signup_form"):
                new_username = st.text_input("Choose a username")
                new_email = st.text_input("Email")
                new_password = st.text_input("Choose a password", type="password")
                signup_submitted = st.form_submit_button("Create Account", use_container_width=True)
            if signup_submitted:
                db_session = get_session()
                try:
                    user = create_user(db_session, new_username, new_email, new_password)
                    st.session_state.user = {"id": user.id, "username": user.username, "email": user.email, "tier": user.tier}
                    st.session_state.conversation_history = []
                    st.success("Account created! Redirecting...")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))

def render_account_panel(user, db_session):
    limits = get_tier_limits(user["tier"])
    st.markdown('<div class="sidebar-section-title">Account</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="account-card">'
        f'<div class="account-name">{user["username"]}</div>'
        f'<div class="tier-badge tier-{user["tier"]}">{limits["label"]} Plan</div>'
        f'</div>',
        unsafe_allow_html=True
    )
    if user["tier"] == "free":
        used_today = count_today_actions(db_session, user["id"])
        st.caption(f"Usage today: {used_today} / {limits['daily_actions']} actions")
        if st.button("⭐ Upgrade to Pro", use_container_width=True, key="upgrade_btn"):
            new_tier = upgrade_to_pro(db_session, user["id"])
            st.session_state.user["tier"] = new_tier
            st.success("Upgraded to Pro! Enjoy unlimited access.")
            st.rerun()
    else:
        st.caption("Unlimited daily actions ✓")
    if st.button("Log Out", use_container_width=True, key="logout_btn"):
        for key in ["user", "conversation_history", "vector_store", "indexed_signature", "pages", "pages_signature"]:
            st.session_state.pop(key, None)
        st.rerun()

def main():
    st.set_page_config(page_title="Documind AI", page_icon=LOGO_PATH if os.path.exists(LOGO_PATH) else ":books:", layout="wide")
    inject_custom_css()
    init_db()

    if "user" not in st.session_state:
        render_auth_screen()
        return

    user = st.session_state.user
    db_session = get_session()

    logo_b64 = get_logo_base64()
    logo_html = f'<img src="data:image/png;base64,{logo_b64}" class="app-logo" />' if logo_b64 else '<div class="icon">📚</div>'
    st.markdown(
        f"""
        <div class="app-header">
            {logo_html}
            <div class="titles">
                <p>Ask questions across multiple documents, powered by Gemini &amp; retrieval-augmented search</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    if 'conversation_history' not in st.session_state:
        st.session_state.conversation_history = load_chat_history(db_session, user["id"])

    with st.sidebar:
        render_account_panel(user, db_session)

        st.markdown('<div class="sidebar-section-title">Model</div>', unsafe_allow_html=True)
        model_name = st.radio("Select the Model:", ("Google AI",), label_visibility="collapsed")

        api_key = DEFAULT_API_KEY
        if api_key:
            st.markdown('<div class="sidebar-section-title">API Key</div>', unsafe_allow_html=True)
            st.caption("✓ Managed by Documind AI")
        elif model_name == "Google AI":
            st.markdown('<div class="sidebar-section-title">API Key</div>', unsafe_allow_html=True)
            api_key = st.text_input("Enter your Google API Key:", type="password", label_visibility="collapsed", placeholder="Enter your Google API Key")
            st.caption("Click [here](https://ai.google.dev/) to get an API key.")

            if not api_key:
                st.warning("Please enter your Google API Key to proceed.")
                return

        st.markdown('<div class="sidebar-section-title">Session</div>', unsafe_allow_html=True)
        col1, col2 = st.columns(2)

        reset_button = col2.button("Reset", use_container_width=True)
        clear_button = col1.button("Rerun", use_container_width=True)

        if reset_button:
            clear_chat_history(db_session, user["id"])
            st.session_state.conversation_history = []  # Clear conversation history
            st.session_state.user_question = None  # Clear user question input
            st.session_state.vector_store = None  # Drop cached index
            st.session_state.indexed_signature = None
            st.session_state.pages = None
            st.session_state.pages_signature = None

            pdf_docs = None  # Reset PDF document

        else:
            if clear_button:
                if 'user_question' in st.session_state:
                    st.warning("The previous query will be discarded.")
                    st.session_state.user_question = ""  # Temizle
                    if len(st.session_state.conversation_history) > 0:
                        st.session_state.conversation_history.pop()  # Son sorguyu kaldır
                else:
                    st.warning("The question in the input will be queried again.")

        st.markdown('<div class="sidebar-section-title">Documents</div>', unsafe_allow_html=True)
        pdf_docs = st.file_uploader("Upload your PDF Files and Click on the Submit & Process Button", accept_multiple_files=True, label_visibility="collapsed")
        if pdf_docs:
            allowed, reason = check_pdf_limit(user["tier"], len(pdf_docs))
            if not allowed:
                st.error(reason)
                pdf_docs = None
        if st.button("Submit & Process", use_container_width=True):
            if pdf_docs:
                with st.spinner("Processing..."):
                    st.success("Done")
            else:
                st.warning("Please upload PDF files before processing.")

    tab_chat, tab_summary, tab_notes, tab_quiz, tab_flashcards, tab_compare, tab_research = st.tabs([
        "💬 Chat", "📝 Summaries", "📖 Study Notes", "❓ Quiz", "🗂 Flashcards", "🔀 Compare", "🔎 Research"
    ])

    with tab_chat:
        user_question = st.text_input("Ask a Question from the PDF Files", placeholder="e.g. What are the key findings in this document?")
        if user_question:
            if enforce_action(db_session, user, "chat"):
                user_input(user_question, model_name, api_key, pdf_docs, st.session_state.conversation_history, db_session=db_session, user_id=user["id"])
                record_usage(db_session, user["id"], "chat")
            st.session_state.user_question = ""  # Clear user question input

    with tab_summary:
        render_summary_tab(pdf_docs, api_key, user, db_session)

    with tab_notes:
        render_study_notes_tab(pdf_docs, api_key, user, db_session)

    with tab_quiz:
        render_quiz_tab(pdf_docs, api_key, user, db_session)

    with tab_flashcards:
        render_flashcards_tab(pdf_docs, api_key, user, db_session)

    with tab_compare:
        render_compare_tab(pdf_docs, api_key, user, db_session)

    with tab_research:
        render_research_tab(pdf_docs, model_name, api_key, user, db_session)

def require_docs(pdf_docs, api_key):
    if not api_key:
        st.warning("Please enter your Google API Key in the sidebar first.")
        return False
    if not pdf_docs:
        st.warning("Please upload at least one PDF in the sidebar first.")
        return False
    return True

def render_locked_feature(action):
    feature_name = FEATURE_NAMES.get(action, action)
    st.info(f"🔒 **{feature_name}** is available on the Pro plan. Upgrade from the sidebar to unlock this feature.")

def enforce_action(db_session, user, action):
    allowed, reason = check_usage(db_session, user["tier"], user["id"], action)
    if not allowed:
        st.warning(f"🚫 {reason}")
        return False
    return True

def render_summary_tab(pdf_docs, api_key, user, db_session):
    st.subheader("Smart Summaries")
    if not require_docs(pdf_docs, api_key):
        return
    source = st.selectbox("Choose a document to summarize", [p.name for p in pdf_docs], key="summary_doc")
    if st.button("Generate Summary", key="summary_btn"):
        if enforce_action(db_session, user, "summary"):
            with st.spinner(f"Summarizing {source}..."):
                text = get_document_text(pdf_docs, api_key, source)
                summary = generate_summary(source, text, api_key)
                st.session_state["summary_result"] = summary
                record_usage(db_session, user["id"], "summary")
    if st.session_state.get("summary_result"):
        st.markdown(f'<div class="feature-card">{st.session_state["summary_result"]}</div>', unsafe_allow_html=True)
        st.download_button(
            "⬇ Download Summary (.md)",
            data=build_export_markdown("Summary", {"Source Document": source}, st.session_state["summary_result"]),
            file_name=f"{source.rsplit('.', 1)[0]}_summary.md",
            mime="text/markdown",
            key="summary_download",
        )

def render_study_notes_tab(pdf_docs, api_key, user, db_session):
    st.subheader("AI Study Notes")
    if not require_docs(pdf_docs, api_key):
        return
    source = st.selectbox("Choose a document", [p.name for p in pdf_docs], key="notes_doc")
    if st.button("Generate Study Notes", key="notes_btn"):
        if enforce_action(db_session, user, "notes"):
            with st.spinner(f"Building study notes for {source}..."):
                text = get_document_text(pdf_docs, api_key, source)
                notes = generate_study_notes(source, text, api_key)
                st.session_state["notes_result"] = notes
                record_usage(db_session, user["id"], "notes")
    if st.session_state.get("notes_result"):
        st.markdown(f'<div class="feature-card">{st.session_state["notes_result"]}</div>', unsafe_allow_html=True)
        st.download_button(
            "⬇ Download Study Notes (.md)",
            data=build_export_markdown("Study Notes", {"Source Document": source}, st.session_state["notes_result"]),
            file_name=f"{source.rsplit('.', 1)[0]}_study_notes.md",
            mime="text/markdown",
            key="notes_download",
        )

def render_quiz_tab(pdf_docs, api_key, user, db_session):
    st.subheader("Quiz & MCQ Generator")
    if is_feature_locked(user["tier"], "quiz"):
        render_locked_feature("quiz")
        return
    if not require_docs(pdf_docs, api_key):
        return
    col1, col2 = st.columns([3, 1])
    source = col1.selectbox("Choose a document", [p.name for p in pdf_docs], key="quiz_doc")
    num_questions = col2.number_input("Questions", min_value=3, max_value=15, value=5, key="quiz_num")
    if st.button("Generate Quiz", key="quiz_btn"):
        with st.spinner(f"Generating {num_questions} questions from {source}..."):
            try:
                text = get_document_text(pdf_docs, api_key, source)
                quiz = generate_quiz(source, text, api_key, num_questions)
                st.session_state["quiz_data"] = quiz
                st.session_state["quiz_answers"] = {}
                st.session_state["quiz_submitted"] = False
                record_usage(db_session, user["id"], "quiz")
            except (json.JSONDecodeError, ValueError) as e:
                st.error(f"Couldn't parse quiz output, try again: {e}")

    quiz = st.session_state.get("quiz_data")
    if quiz:
        for i, q in enumerate(quiz):
            st.markdown(f'<div class="quiz-question">Q{i+1}. {q["question"]}</div>', unsafe_allow_html=True)
            options = q["options"]
            labels = [f"{k}. {v}" for k, v in options.items()]
            choice = st.radio("Choose one", labels, key=f"quiz_q_{i}", label_visibility="collapsed", index=None)
            if choice:
                st.session_state["quiz_answers"][i] = choice[0]
            st.write("")

        st.download_button(
            "⬇ Download Quiz (.md)",
            data=build_quiz_markdown(source, quiz),
            file_name=f"{source.rsplit('.', 1)[0]}_quiz.md",
            mime="text/markdown",
            key="quiz_download",
        )

        if st.button("Check Answers", key="quiz_check"):
            st.session_state["quiz_submitted"] = True

        if st.session_state.get("quiz_submitted"):
            score = 0
            for i, q in enumerate(quiz):
                picked = st.session_state["quiz_answers"].get(i)
                correct = q["correct"]
                if picked == correct:
                    score += 1
                    st.markdown(f'<div class="quiz-correct">Q{i+1}: Correct ✓</div>', unsafe_allow_html=True)
                else:
                    st.markdown(f'<div class="quiz-incorrect">Q{i+1}: Incorrect — correct answer is {correct}. {q["options"].get(correct, "")}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="quiz-explanation">{q.get("explanation", "")}</div>', unsafe_allow_html=True)
            st.success(f"Score: {score} / {len(quiz)}")

def render_flashcards_tab(pdf_docs, api_key, user, db_session):
    st.subheader("Flashcard Generator")
    if is_feature_locked(user["tier"], "flashcards"):
        render_locked_feature("flashcards")
        return
    if not require_docs(pdf_docs, api_key):
        return
    col1, col2 = st.columns([3, 1])
    source = col1.selectbox("Choose a document", [p.name for p in pdf_docs], key="fc_doc")
    num_cards = col2.number_input("Cards", min_value=5, max_value=25, value=10, key="fc_num")
    if st.button("Generate Flashcards", key="fc_btn"):
        with st.spinner(f"Generating {num_cards} flashcards from {source}..."):
            try:
                text = get_document_text(pdf_docs, api_key, source)
                cards = generate_flashcards(source, text, api_key, num_cards)
                st.session_state["flashcards"] = cards
                st.session_state["fc_index"] = 0
                st.session_state["fc_flipped"] = False
                record_usage(db_session, user["id"], "flashcards")
            except (json.JSONDecodeError, ValueError) as e:
                st.error(f"Couldn't parse flashcard output, try again: {e}")

    cards = st.session_state.get("flashcards")
    if cards:
        idx = st.session_state.get("fc_index", 0)
        flipped = st.session_state.get("fc_flipped", False)
        card = cards[idx]
        label = "Answer" if flipped else "Question"
        content = card["back"] if flipped else card["front"]
        st.markdown(
            f'<div class="flashcard-label">{label} · Card {idx+1}/{len(cards)}</div>'
            f'<div class="flashcard">{content}</div>',
            unsafe_allow_html=True
        )
        c1, c2, c3 = st.columns(3)
        if c1.button("⬅ Previous", key="fc_prev", use_container_width=True) and idx > 0:
            st.session_state["fc_index"] -= 1
            st.session_state["fc_flipped"] = False
            st.rerun()
        if c2.button("🔄 Flip", key="fc_flip", use_container_width=True):
            st.session_state["fc_flipped"] = not flipped
            st.rerun()
        if c3.button("Next ➡", key="fc_next", use_container_width=True) and idx < len(cards) - 1:
            st.session_state["fc_index"] += 1
            st.session_state["fc_flipped"] = False
            st.rerun()

        cards_df = pd.DataFrame([
            {"#": i + 1, "Question": strip_markdown(c["front"]), "Answer": strip_markdown(c["back"])}
            for i, c in enumerate(cards)
        ])
        cards_csv = cards_df.to_csv(index=False).encode("utf-8-sig")
        st.download_button(
            "⬇ Download Flashcards (.csv)",
            data=cards_csv,
            file_name=f"{source.rsplit('.', 1)[0]}_flashcards.csv",
            mime="text/csv",
            key="fc_download",
        )

def render_compare_tab(pdf_docs, api_key, user, db_session):
    st.subheader("Document Comparison")
    if is_feature_locked(user["tier"], "compare"):
        render_locked_feature("compare")
        return
    if not require_docs(pdf_docs, api_key):
        return
    names = [p.name for p in pdf_docs]
    if len(names) < 2:
        st.info("Upload at least two PDFs to compare them.")
        return
    col1, col2 = st.columns(2)
    source_a = col1.selectbox("Document A", names, index=0, key="cmp_a")
    source_b = col2.selectbox("Document B", names, index=1, key="cmp_b")
    if st.button("Compare Documents", key="cmp_btn"):
        if source_a == source_b:
            st.warning("Choose two different documents.")
        else:
            with st.spinner(f"Comparing {source_a} and {source_b}..."):
                text_a = get_document_text(pdf_docs, api_key, source_a)
                text_b = get_document_text(pdf_docs, api_key, source_b)
                comparison = generate_comparison(source_a, text_a, source_b, text_b, api_key)
                st.session_state["comparison_result"] = comparison
                record_usage(db_session, user["id"], "compare")
    if st.session_state.get("comparison_result"):
        st.markdown(f'<div class="feature-card">{st.session_state["comparison_result"]}</div>', unsafe_allow_html=True)
        st.download_button(
            "⬇ Download Comparison (.md)",
            data=build_export_markdown(
                "Document Comparison",
                {"Document A": source_a, "Document B": source_b},
                st.session_state["comparison_result"],
            ),
            file_name=f"comparison_{source_a.rsplit('.', 1)[0]}_vs_{source_b.rsplit('.', 1)[0]}.md",
            mime="text/markdown",
            key="cmp_download",
        )

def render_research_tab(pdf_docs, model_name, api_key, user, db_session):
    st.subheader("Research Assistant")
    if is_feature_locked(user["tier"], "research"):
        render_locked_feature("research")
        return
    if not require_docs(pdf_docs, api_key):
        return
    topic = st.text_input("Enter a research topic or question", placeholder="e.g. How does encapsulation improve software maintainability?", key="research_topic")
    if st.button("Run Research", key="research_btn"):
        with st.spinner("Building knowledge base..."):
            vector_store = get_or_build_vector_store(pdf_docs, model_name, api_key)
        progress = st.progress(0.0, text="Decomposing topic...")
        def on_progress(i, total, sub_q):
            progress.progress((i + 1) / (total + 1), text=f"Investigating: {sub_q}")
        try:
            report, sub_questions = generate_research_report(topic, vector_store, api_key, progress_callback=on_progress)
            progress.progress(1.0, text="Done")
            st.session_state["research_report"] = report
            st.session_state["research_subquestions"] = sub_questions
            record_usage(db_session, user["id"], "research")
        except (json.JSONDecodeError, ValueError) as e:
            st.error(f"Research generation failed: {e}")

    if st.session_state.get("research_subquestions"):
        with st.expander("Sub-questions investigated"):
            for q in st.session_state["research_subquestions"]:
                st.markdown(f"- {q}")
    if st.session_state.get("research_report"):
        st.markdown(f'<div class="feature-card">{st.session_state["research_report"]}</div>', unsafe_allow_html=True)
        sub_q_list = "\n".join(f"- {q}" for q in st.session_state.get("research_subquestions", []))
        body = st.session_state["research_report"]
        if sub_q_list:
            body += f"\n\n## Sub-questions Investigated\n\n{sub_q_list}"
        st.download_button(
            "⬇ Download Research Report (.md)",
            data=build_export_markdown("Research Report", {"Topic": topic}, body),
            file_name="research_report.md",
            mime="text/markdown",
            key="research_download",
        )

if __name__ == "__main__":
    main()