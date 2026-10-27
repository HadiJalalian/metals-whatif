"""نقطه ورود uvicorn: ``metals_whatif.api.main:app``."""
from .app import create_app

app = create_app()
