"""Simple in-memory sliding-window rate limiter.

Good enough to blunt naive brute-force attempts against auth endpoints in a
single-process dev/demo deployment. It resets on restart and does not
coordinate across multiple worker processes — a production deployment behind
multiple workers should replace this with a shared store (e.g. Redis).
"""
import time
from collections import defaultdict

from fastapi import HTTPException, Request

_hits: dict[str, list[float]] = defaultdict(list)


def _check(key: str, max_calls: int, window_seconds: int):
    now = time.monotonic()
    window_start = now - window_seconds
    hits = _hits[key]
    hits[:] = [t for t in hits if t > window_start]
    if len(hits) >= max_calls:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment and try again.")
    hits.append(now)


def rate_limiter(key: str, max_calls: int, window_seconds: int):
    """Returns a FastAPI dependency that rate-limits by client IP under `key`."""

    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        _check(f"{key}:{client_ip}", max_calls, window_seconds)

    return dependency
