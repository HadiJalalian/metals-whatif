# tests/conftest.py
import pytest
from factories import make_inputs as _make_inputs


@pytest.fixture
def make_inputs():
    return _make_inputs