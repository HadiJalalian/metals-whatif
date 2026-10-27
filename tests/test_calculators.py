import numpy as np
import pytest
from metals_whatif.core import calculate_silver_certificate
from metals_whatif.core import (
    calculate_18k_gold,
    calculate_bubble_pct,
    calculate_mazaneh,
    calculate_metal_certificate,
    calculate_silver_999,
)


def test_18k_gold_matches_formula():
    expected = 4000 * 200_000 / 31.1034 * 0.75
    assert calculate_18k_gold(4000, 200_000) == pytest.approx(expected)


def test_gold_bubble_applies_multiplicatively():
    base = calculate_18k_gold(4000, 200_000)
    assert calculate_18k_gold(4000, 200_000, 10) == pytest.approx(base * 1.1)


def test_mazaneh_is_18k_times_factor():
    price_18k = calculate_18k_gold(4000, 200_000)
    assert calculate_mazaneh(4000, 200_000) == pytest.approx(price_18k * 4.3318)


def test_silver_999():
    expected = 50 * 200_000 / 31.1034
    assert calculate_silver_999(50, 200_000) == pytest.approx(expected)


def test_certificate_intrinsic_value():
    # ۳۰۰۰ دلار/تن × ۲۰۰٬۰۰۰ تومان ÷ ۱۰۰۰ = ۶۰۰٬۰۰۰ تومان به‌ازای هر کیلوگرم
    assert calculate_metal_certificate(3000, 200_000, 0) == pytest.approx(600_000)


def test_certificate_with_premium():
    assert calculate_metal_certificate(3000, 200_000, 5) == pytest.approx(630_000)


def test_certificate_with_costs_is_additive():
    value = calculate_metal_certificate(
        3000, 200_000, 0, include_costs=True, vat_pct=10, fee_pct=0.24
    )
    assert value == pytest.approx(600_000 * 1.1024)


def test_certificate_costs_ignored_when_disabled():
    value = calculate_metal_certificate(
        3000, 200_000, 0, include_costs=False, vat_pct=10, fee_pct=0.24
    )
    assert value == pytest.approx(600_000)


def test_bubble_pct():
    assert calculate_bubble_pct(660_000, 600_000) == pytest.approx(10.0)
    assert calculate_bubble_pct(540_000, 600_000) == pytest.approx(-10.0)


def test_functions_support_numpy_broadcasting():
    rows = np.array([3000.0, 3100.0])[:, None]
    cols = np.array([200_000.0, 205_000.0, 210_000.0])[None, :]
    result = calculate_metal_certificate(rows, cols, 0)
    assert result.shape == (2, 3)
    assert result[0, 0] == pytest.approx(600_000)


def test_silver_certificate_intrinsic_value():
    expected = 50 * 200_000 / 31.1034
    assert calculate_silver_certificate(50, 200_000) == pytest.approx(expected)


def test_silver_certificate_with_premium():
    base = calculate_silver_certificate(50, 200_000)
    assert calculate_silver_certificate(50, 200_000, 5) == pytest.approx(
        base * 1.05
    )


def test_silver_certificate_costs_are_additive():
    base = calculate_silver_certificate(50, 200_000)
    value = calculate_silver_certificate(
        50, 200_000, 0, include_costs=True, vat_pct=0, fee_pct=0.24
    )
    assert value == pytest.approx(base * 1.0024)


def test_silver_certificate_costs_ignored_when_disabled():
    base = calculate_silver_certificate(50, 200_000)
    value = calculate_silver_certificate(
        50, 200_000, 0, include_costs=False, vat_pct=10, fee_pct=0.24
    )
    assert value == pytest.approx(base)


def test_silver_certificate_supports_numpy_broadcasting():
    rows = np.array([30.0, 40.0])[:, None]
    cols = np.array([200_000.0, 210_000.0, 220_000.0])[None, :]
    result = calculate_silver_certificate(rows, cols, 0)
    assert result.shape == (2, 3)
    assert result[0, 0] == pytest.approx(30 * 200_000 / 31.1034)