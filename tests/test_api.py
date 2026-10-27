# tests/test_api.py
"""قرارداد HTTP: اعتبارسنجی ورودی، برابری با core و JSON استاندارد."""
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from metals_whatif.api import create_app
from metals_whatif.api.results import _matrix_payload
from metals_whatif.api.schemas import AnalysisRequest
from metals_whatif.core import AssetKey, calculate_18k_gold
from metals_whatif.core.matrix import SensitivityMatrix
from metals_whatif.core.scenarios import ScenarioAxis
from metals_whatif.core.service import run_analysis

ASSET_KEYS = {key.value for key in AssetKey}


@pytest.fixture(autouse=True)
def _clear_cache():
    from metals_whatif.core import service

    service.clear_cache()
    yield
    service.clear_cache()


@pytest.fixture
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture
def payload():
    return {
        "usd": {"base": 200_000, "step": 5_000, "steps_up": 3, "steps_down": 2},
        "gold": {"base": 4_000, "step": 50, "steps_up": 2, "steps_down": 2},
        "silver": {"base": 50, "step": 10, "steps_up": 2, "steps_down": 2},
        "copper": {"base": 14_000, "step": 250, "steps_up": 2, "steps_down": 2},
        "zinc": {"base": 3_000, "step": 100, "steps_up": 2, "steps_down": 2},
        "bubble_pct": 5.0,
        "market_prices": {"gold_18k": 60_000_000, "copper": 900_000},
    }


# ------------------------------------------------------------------
# سلامت و شکل پاسخ
# ------------------------------------------------------------------

def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_analysis_returns_every_asset(client, payload):
    body = client.post("/api/analysis", json=payload).json()
    assert set(body) == ASSET_KEYS


def test_response_is_strict_json(client, payload):
    """هیچ literal خارج از spec (NaN/Infinity) به مرورگر نرسد."""
    response = client.post("/api/analysis", json=payload)
    assert "NaN" not in response.text
    assert "Infinity" not in response.text
    json.loads(response.text)


def test_matrix_shape_follows_positive_axis_values(client, payload):
    body = client.post("/api/analysis", json=payload).json()
    matrix = body["gold_18k"]["price"]

    assert len(matrix["row"]["values"]) == 5
    assert len(matrix["col"]["values"]) == 6
    assert len(matrix["values"]) == 5
    assert all(len(row) == 6 for row in matrix["values"])


# ------------------------------------------------------------------
# برابری با core
# ------------------------------------------------------------------

def test_api_values_equal_core_values(client, payload):
    body = client.post("/api/analysis", json=payload).json()
    results = run_analysis(AnalysisRequest(**payload).to_core())

    for key in AssetKey:
        assert np.array_equal(
            np.asarray(body[key.value]["price"]["values"], dtype=float),
            results[key].price.values,
        )


def test_row_axis_name_matches_actual_axis(client, payload):
    """نگاشت نمایشی _ROW_AXIS_NAME نباید از محور واقعیِ service جدا بیفتد."""
    body = client.post("/api/analysis", json=payload).json()
    inputs = AnalysisRequest(**payload).to_core()

    row_axes = {
        "gold": inputs.gold,
        "silver": inputs.silver,
        "copper": inputs.copper,
        "zinc": inputs.zinc,
    }
    for key in AssetKey:
        matrix = body[key.value]["price"]
        assert np.array_equal(
            np.asarray(matrix["row"]["values"], dtype=float),
            np.asarray(row_axes[matrix["row_axis"]].values(), dtype=float),
        )
        assert np.array_equal(
            np.asarray(matrix["col"]["values"], dtype=float),
            np.asarray(inputs.usd.values(), dtype=float),
        )


def test_bubble_absent_without_market_price(client, payload):
    body = client.post("/api/analysis", json=payload).json()
    assert body["gold_18k"]["bubble"] is not None
    assert body["mazaneh"]["bubble"] is None


def test_bubble_matrix_matches_formula(client, payload):
    body = client.post("/api/analysis", json=payload).json()
    matrix = body["gold_18k"]["bubble"]
    market_price = 60_000_000

    fair = calculate_18k_gold(4_000, 200_000, 5.0)
    expected = (market_price - fair) / fair * 100

    row = matrix["row"]["values"].index(4_000)
    col = matrix["col"]["values"].index(200_000)
    assert matrix["values"][row][col] == pytest.approx(expected, rel=1e-9)


# ------------------------------------------------------------------
# پاک‌سازی مقادیر غیرمتناهی
# ------------------------------------------------------------------

def test_non_finite_cells_become_null():
    axis = ScenarioAxis(base=1.0, step=1.0)
    values = np.array([[np.nan, np.inf], [-np.inf, 2.0]])
    matrix = SensitivityMatrix(
        values=values, row_axis=axis, col_axis=axis
    )
    payload = _matrix_payload(matrix, "gold")
    assert payload.values == [[None, None], [None, 2.0]]
    assert json.dumps(payload.model_dump())


# ------------------------------------------------------------------
# اعتبارسنجی
# ------------------------------------------------------------------

@pytest.mark.parametrize(
    "field,value",
    [
        ("step", 0),
        ("step", -5),
        ("base", -1),
        ("steps_up", 21),
        ("steps_down", -1),
    ],
)
def test_axis_validation(client, payload, field, value):
    payload["gold"][field] = value
    assert client.post("/api/analysis", json=payload).status_code == 422


@pytest.mark.parametrize("body", [
    {"usd": {"base": 1, "step": 1, "unknown_field": 2}},
    {"bubble_pct": 99},
    {"bubble_pct": -99},
    {"market_prices": {"gold_18k": -1}},
    {"silver_cert_params": {"premium_pct": 1_000}},
])
def test_rejects_out_of_range_or_unknown(client, payload, body):
    payload.update(body)
    assert client.post("/api/analysis", json=payload).status_code == 422


def test_empty_axes_returns_structured_400(client, payload):
    """خطای core فارسی است، اما قرارداد API کلید انگلیسی می‌دهد."""
    payload["gold"].update({"base": 0, "step": 100, "steps_down": 0, "steps_up": 0})
    response = client.post("/api/analysis", json=payload)

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "empty_axes"
    assert detail["axes"] == ["gold"]


def test_defaults_reproduce_streamlit_axis():
    """steps_up/down و vat پیش‌فرض با UI استریم‌لیت یکی بماند."""
    request = AnalysisRequest(
        usd={"base": 200_000, "step": 5_000},
        gold={"base": 4_000, "step": 50},
        silver={"base": 50, "step": 10},
        copper={"base": 14_000, "step": 250},
        zinc={"base": 3_000, "step": 100},
    )
    assert request.silver_cert_params.vat_pct == 0.0
    assert request.copper_params.vat_pct == 10.0
    assert request.copper_params.fee_pct == 0.24
    assert (request.gold.steps_up, request.gold.steps_down) == (4, 4)
    assert len(request.to_core().gold.values()) == 9
