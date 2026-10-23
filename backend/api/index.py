"""SevAIQ FastAPI Application Entry Point for Vercel Serverless Function (api/index.py).

This module exposes the FastAPI ASGI application from app.main for Vercel.
"""

import sys
from pathlib import Path

# Add backend root directory to sys.path (parent of api/)
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

__all__ = ["app"]
