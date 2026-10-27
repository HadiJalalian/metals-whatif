# tests/test_hashable.py
import pytest
from dataclasses import replace

from metals_whatif.core.scenarios import ScenarioAxis
from metals_whatif.core.models import CertificateParams

FIELDS = [
    "usd", "gold", "silver", "copper", "zinc",
    "bubble_pct", "copper_params", "zinc_params",
    "silver_cert_params", "market_prices",
]

@pytest.mark.parametrize("name", FIELDS)
def test_input_field_is_hashable(make_inputs, name):
    hash(getattr(make_inputs(), name))

def test_whole_inputs_hashable(make_inputs):
    hash(make_inputs())

def test_equal_but_distinct_objects_share_hash():
    a = ScenarioAxis(base=100, step=5, steps_down=2, steps_up=3)
    b = ScenarioAxis(base=100.0, step=5.0, steps_down=2, steps_up=3)
    assert a is not b and a == b and hash(a) == hash(b)

def test_different_params_give_different_keys():
    p = CertificateParams()
    assert replace(p, fee_pct=1.0) != p
    assert len({p, replace(p, fee_pct=1.0)}) == 2