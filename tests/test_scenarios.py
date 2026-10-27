import pytest

from metals_whatif.core import ScenarioAxis


def test_zinc_default_range_covers_recommended_band():
    values = ScenarioAxis(3000, 100, steps_down=5, steps_up=6).values()
    assert min(values) == 2500
    assert max(values) == 3600
    assert len(values) == 12


def test_non_positive_values_are_dropped():
    assert ScenarioAxis(100, 60, steps_down=3, steps_up=0).values() == (40, 100)


def test_zero_steps_returns_only_base():
    assert ScenarioAxis(50, 5).values() == (50,)


def test_invalid_step_raises():
    with pytest.raises(ValueError):
        ScenarioAxis(100, 0)


def test_negative_steps_raise():
    with pytest.raises(ValueError):
        ScenarioAxis(100, 10, steps_down=-1)