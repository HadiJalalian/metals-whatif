# tests/test_cache.py
from dataclasses import replace

import pytest

from metals_whatif.core import service
from metals_whatif.core.models import AssetKey, CertificateParams, MarketPrices


@pytest.fixture(autouse=True)
def _fresh_cache():
    service.clear_cache()
    yield
    service.clear_cache()


def test_market_price_change_does_not_recompute(make_inputs):
    inputs = make_inputs()
    service.run_analysis(inputs)
    misses = service.cache_info().misses

    service.run_analysis(replace(inputs, market_prices=MarketPrices(gold_18k=200)))
    assert service.cache_info().misses == misses


def test_copper_params_recompute_only_copper(make_inputs):
    inputs = make_inputs()
    service.run_analysis(inputs)
    before = service.cache_info().misses

    changed = replace(inputs, copper_params=CertificateParams(fee_pct=3.0))
    service.run_analysis(changed)
    assert service.cache_info().misses == before + 1


def test_cached_matrix_is_readonly(make_inputs):
    res = service.run_analysis(make_inputs())
    with pytest.raises(ValueError):
        res[AssetKey.COPPER].price.values[0, 0] = 0