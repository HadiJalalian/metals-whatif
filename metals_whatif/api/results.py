"""تبدیل خروجی core به بارش JSON."""
from __future__ import annotations

import math
from typing import Dict, List, Optional

import numpy as np

from metals_whatif.core import (
    AnalysisResult,
    AssetKey,
    SensitivityMatrix,
)

from .schemas import AssetResultPayload, AxisValues, MatrixPayload

# نام محور سطر هر دارایی، فقط برای برچسب‌زدن در UI.
# آینه _asset_inputs در service است و tests/test_api.py بر برابری
# این نگاشت با محور واقعیِ ماتریس نظارت می‌کند.
_ROW_AXIS_NAME: Dict[AssetKey, str] = {
    AssetKey.GOLD_18K: "gold",
    AssetKey.MAZANEH: "gold",
    AssetKey.SILVER_999: "silver",
    AssetKey.SILVER_CERT: "silver",
    AssetKey.COPPER: "copper",
    AssetKey.ZINC: "zinc",
}


def _finite(value) -> Optional[float]:
    number = float(value)
    return number if math.isfinite(number) else None


def _grid(values: np.ndarray) -> List[List[Optional[float]]]:
    return [[_finite(value) for value in row] for row in values]


def _matrix_payload(matrix: SensitivityMatrix, row_axis_name: str) -> MatrixPayload:
    return MatrixPayload(
        row_axis=row_axis_name,
        row=AxisValues(
            values=list(matrix.row_axis.values()), base=matrix.row_axis.base
        ),
        col=AxisValues(
            values=list(matrix.col_axis.values()), base=matrix.col_axis.base
        ),
        values=_grid(matrix.values),
    )


def build_asset_result(result: AnalysisResult, key: AssetKey) -> AssetResultPayload:
    name = _ROW_AXIS_NAME[key]
    return AssetResultPayload(
        price=_matrix_payload(result.price, name),
        bubble=None if result.bubble is None else _matrix_payload(result.bubble, name),
        market_price=result.market_price,
    )


def build_response(
    results: Dict[AssetKey, AnalysisResult]
) -> Dict[AssetKey, AssetResultPayload]:
    return {key: build_asset_result(result, key) for key, result in results.items()}
