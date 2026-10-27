import numpy as np
import pytest
from factories import make_inputs
from metals_whatif.core import (
    AssetKey,
    CertificateParams,
    DashboardInputs,
    EmptyScenarioError,
    MarketPrices,
    ScenarioAxis,
    run_analysis,
)

def test_all_assets_are_computed():
    results = run_analysis(make_inputs())
    assert set(results) == set(AssetKey)


def test_matrix_shapes():
    results = run_analysis(make_inputs())
    assert results[AssetKey.GOLD_18K].price.values.shape == (9, 9)
    assert results[AssetKey.ZINC].price.values.shape == (12, 9)


def test_zinc_base_cell_value():
    results = run_analysis(make_inputs())
    matrix = results[AssetKey.ZINC].price
    row = matrix.row_axis.values().index(3000)
    col = matrix.col_axis.values().index(200_000)
    assert matrix.values[row, col] == pytest.approx(600_000)


def test_bubble_is_none_without_market_price():
    results = run_analysis(make_inputs())
    assert results[AssetKey.ZINC].bubble is None


def test_bubble_with_market_price():
    inputs = make_inputs(market_prices=MarketPrices(zinc=660_000))
    result = run_analysis(inputs)[AssetKey.ZINC]
    matrix = result.price
    row = matrix.row_axis.values().index(3000)
    col = matrix.col_axis.values().index(200_000)
    assert result.bubble.values[row, col] == pytest.approx(10.0)


def test_copper_and_zinc_use_their_own_params():
    inputs = make_inputs(
        copper_params=CertificateParams(premium_pct=0),
        zinc_params=CertificateParams(premium_pct=10),
    )
    results = run_analysis(inputs)
    zinc = results[AssetKey.ZINC].price
    row = zinc.row_axis.values().index(3000)
    col = zinc.col_axis.values().index(200_000)
    assert zinc.values[row, col] == pytest.approx(660_000)


def test_mazaneh_and_18k_share_gold_axis():
    results = run_analysis(make_inputs())
    ratio = (
        results[AssetKey.MAZANEH].price.values
        / results[AssetKey.GOLD_18K].price.values
    )
    assert np.allclose(ratio, 4.3318)


def test_empty_axis_raises():
    with pytest.raises(EmptyScenarioError) as exc:
        run_analysis(make_inputs(zinc=ScenarioAxis(-10, 1, 0, 0)))
    assert "روی" in exc.value.axis_names


def _cell(result, row_value, col_value):
    m = result.price
    return (
        m.row_axis.values().index(row_value),
        m.col_axis.values().index(col_value),
    )


def test_silver_cert_matches_raw_silver_without_premium():
    results = run_analysis(make_inputs())
    assert np.allclose(
        results[AssetKey.SILVER_CERT].price.values,
        results[AssetKey.SILVER_999].price.values,
    )


def test_silver_cert_uses_its_own_premium_not_bubble_pct():
    inputs = make_inputs(
        bubble_pct=20,
        silver_cert_params=CertificateParams(premium_pct=5, vat_pct=0),
    )
    results = run_analysis(inputs)
    cert = results[AssetKey.SILVER_CERT]
    r, c = _cell(cert, 50, 200_000)
    assert cert.price.values[r, c] == pytest.approx(
        50 * 200_000 / 31.1034 * 1.05
    )


def test_silver_cert_default_vat_is_zero():
    inputs = make_inputs()
    assert inputs.silver_cert_params.vat_pct == 0.0
    assert inputs.silver_cert_params.fee_pct == 0.24


def test_silver_cert_bubble_with_market_price():
    fair = 50 * 200_000 / 31.1034
    inputs = make_inputs(
        market_prices=MarketPrices(silver_cert=fair * 1.1)
    )
    cert = run_analysis(inputs)[AssetKey.SILVER_CERT]
    r, c = _cell(cert, 50, 200_000)
    assert cert.bubble.values[r, c] == pytest.approx(10.0)


def test_silver_cert_shape_follows_silver_axis():
    results = run_analysis(make_inputs())
    assert results[AssetKey.SILVER_CERT].price.values.shape == (9, 9)


from metals_whatif.core import (
    AssetKey, EmptyScenarioError, MarketPrices, ScenarioAxis, run_analysis,
)
from metals_whatif.core import service

BUBBLE_BASED = (AssetKey.GOLD_18K, AssetKey.MAZANEH, AssetKey.SILVER_999)
CERT_BASED = (AssetKey.SILVER_CERT, AssetKey.COPPER, AssetKey.ZINC)


def test_bubble_pct_affects_only_bubble_based_assets():
    # کلید کش اگر ناقص باشد، نتیجه‌ی کهنه برمی‌گردد
    a = run_analysis(make_inputs(bubble_pct=0))
    b = run_analysis(make_inputs(bubble_pct=20))
    for key in BUBBLE_BASED:
        assert not np.allclose(a[key].price.values, b[key].price.values)
    for key in CERT_BASED:
        assert np.array_equal(a[key].price.values, b[key].price.values)


def test_results_identical_with_and_without_cache():
    inputs = make_inputs()
    first = run_analysis(inputs)
    service.clear_cache()
    second = run_analysis(inputs)
    for key in AssetKey:
        assert np.array_equal(first[key].price.values, second[key].price.values)


def test_repeated_run_reuses_same_matrix_object():
    inputs = make_inputs()
    a = run_analysis(inputs)[AssetKey.ZINC].price
    b = run_analysis(inputs)[AssetKey.ZINC].price
    assert a is b


@pytest.mark.parametrize("bad_price", [0, -5])
def test_non_positive_market_price_gives_no_bubble(bad_price):
    inputs = make_inputs(market_prices=MarketPrices(zinc=bad_price))
    assert run_analysis(inputs)[AssetKey.ZINC].bubble is None


def test_all_empty_axes_are_reported():
    empty = ScenarioAxis(-10, 1, 0, 0)
    with pytest.raises(EmptyScenarioError) as exc:
        run_analysis(make_inputs(usd=empty, copper=empty))
    assert set(exc.value.axis_names) == {"دلار", "مس"}


def test_prices_increase_along_both_axes():
    m = run_analysis(make_inputs())[AssetKey.GOLD_18K].price.values
    assert (np.diff(m, axis=0) > 0).all()
    assert (np.diff(m, axis=1) > 0).all()