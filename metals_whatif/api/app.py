"""اپلیکیشن FastAPI و اتصالات سطح HTTP."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from metals_whatif import __version__
from metals_whatif.core import EmptyScenarioError, run_analysis

from .results import build_response
from .schemas import AnalysisRequest, AnalysisResponse

# origin پیش‌فرض سرور توسعه Vite؛ در استقرار با متغیر محیطی بازنویسی می‌شود.
_DEFAULT_CORS_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")

_WEB_DIST = Path(__file__).resolve().parents[2] / "web" / "dist"

# core نام فارسی محورها را در خطا می‌گذارد؛ کلاینت دوزبانه به کلید نیاز دارد.
_AXIS_KEYS = {
    "دلار": "usd",
    "طلا": "gold",
    "نقره": "silver",
    "مس": "copper",
    "روی": "zinc",
}


def _axis_keys(names) -> List[str]:
    return [_AXIS_KEYS.get(name, name) for name in names]


def _cors_origins() -> List[str]:
    raw = os.getenv("METALS_WHATIF_CORS_ORIGINS")
    if not raw:
        return list(_DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def create_app() -> FastAPI:
    app = FastAPI(
        title="Metals What-if API",
        description="ماتریس حساسیت و حباب طلا، نقره، مس و روی",
        version=__version__,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok", "version": __version__}

    @app.post("/api/analysis", response_model=AnalysisResponse)
    def analysis(request: AnalysisRequest) -> dict:
        try:
            results = run_analysis(request.to_core())
        except EmptyScenarioError as exc:
            raise HTTPException(
                status_code=400,
                detail={"code": "empty_axes", "axes": _axis_keys(exc.axis_names)},
            ) from exc
        return build_response(results)

    if _WEB_DIST.is_dir():
        app.mount("/", StaticFiles(directory=_WEB_DIST, html=True), name="web")

    return app
