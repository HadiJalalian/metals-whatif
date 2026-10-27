# tests/factories.py
from metals_whatif.core import DashboardInputs, ScenarioAxis


def make_inputs(**overrides):
    params = dict(
        usd=ScenarioAxis(200_000, 5_000, 4, 4),
        gold=ScenarioAxis(4000, 50, 4, 4),
        silver=ScenarioAxis(50, 10, 4, 4),
        copper=ScenarioAxis(14_000, 250, 4, 4),
        zinc=ScenarioAxis(3000, 100, 5, 6),
    )
    params.update(overrides)
    return DashboardInputs(**params)