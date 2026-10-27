"""لایه HTTP روی هسته خالص: FastAPI + اسکیمای Pydantic.

`core` هیچ وابستگی به این بسته ندارد؛ همه تبدیل‌ها اینجاست.
"""
from .app import create_app
from .schemas import AnalysisRequest, AnalysisResponse

__all__ = ["create_app", "AnalysisRequest", "AnalysisResponse"]
