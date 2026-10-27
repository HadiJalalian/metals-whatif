"""اسکیمای درخواست/پاسخ API (آینه مدل‌های core، بدون منطق مالی).

برچسب‌های محور به‌صورت عدد خام ارسال می‌شوند؛ قالب‌بندی locale و متون
فارسی/انگلیسی تماماً مسئولیت فرانت‌اند است تا یک پایانه دوزبانه بمانیم.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from metals_whatif.core import (
    AssetKey,
    CertificateParams,
    DashboardInputs,
    MarketPrices,
    ScenarioAxis,
)

# سقف گام‌ها همان قیدی است که UI استریم‌لیت اعمال می‌کرد؛
# ۲۱×۲۱ سلول برای هر دارایی مرز عملی شبکه‌ی دوبعدی است.
MAX_STEPS = 20


class ScenarioAxisModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    base: float = Field(ge=0)
    step: float = Field(gt=0)
    steps_up: int = Field(default=4, ge=0, le=MAX_STEPS)
    steps_down: int = Field(default=4, ge=0, le=MAX_STEPS)

    def to_core(self) -> ScenarioAxis:
        return ScenarioAxis(
            base=self.base,
            step=self.step,
            steps_down=self.steps_down,
            steps_up=self.steps_up,
        )


class CertificateParamsModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    premium_pct: float = Field(default=0.0, ge=-40.0, le=40.0)
    include_costs: bool = False
    vat_pct: float = Field(default=10.0, ge=0.0, le=100.0)
    fee_pct: float = Field(default=0.24, ge=0.0, le=100.0)

    def to_core(self) -> CertificateParams:
        return CertificateParams(
            premium_pct=self.premium_pct,
            include_costs=self.include_costs,
            vat_pct=self.vat_pct,
            fee_pct=self.fee_pct,
        )


class MarketPricesModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    gold_18k: float = Field(default=0.0, ge=0.0)
    mazaneh: float = Field(default=0.0, ge=0.0)
    silver_999: float = Field(default=0.0, ge=0.0)
    silver_cert: float = Field(default=0.0, ge=0.0)
    copper: float = Field(default=0.0, ge=0.0)
    zinc: float = Field(default=0.0, ge=0.0)

    def to_core(self) -> MarketPrices:
        return MarketPrices(**self.model_dump())


class AnalysisRequest(BaseModel):
    """ورودی کامل داشبورد؛ نام فیلدها با DashboardInputs یکی است."""

    model_config = ConfigDict(extra="forbid")

    usd: ScenarioAxisModel
    gold: ScenarioAxisModel
    silver: ScenarioAxisModel
    copper: ScenarioAxisModel
    zinc: ScenarioAxisModel
    bubble_pct: float = Field(default=0.0, ge=-20.0, le=40.0)
    market_prices: MarketPricesModel = Field(default_factory=MarketPricesModel)
    copper_params: CertificateParamsModel = Field(
        default_factory=CertificateParamsModel
    )
    zinc_params: CertificateParamsModel = Field(
        default_factory=CertificateParamsModel
    )
    silver_cert_params: CertificateParamsModel = Field(
        default_factory=lambda: CertificateParamsModel(vat_pct=0.0)
    )

    def to_core(self) -> DashboardInputs:
        return DashboardInputs(
            usd=self.usd.to_core(),
            gold=self.gold.to_core(),
            silver=self.silver.to_core(),
            copper=self.copper.to_core(),
            zinc=self.zinc.to_core(),
            bubble_pct=self.bubble_pct,
            market_prices=self.market_prices.to_core(),
            copper_params=self.copper_params.to_core(),
            zinc_params=self.zinc_params.to_core(),
            silver_cert_params=self.silver_cert_params.to_core(),
        )


class AxisValues(BaseModel):
    """یک محور سناریو به‌همراه مقدار پایه‌اش برای برجسته‌کردن در UI."""

    values: List[float]
    base: float


class MatrixPayload(BaseModel):
    """ماتریس دوبعدی؛ values[i][j] ↔ row_values[i] × col_values[j].

    خانه‌های غیرمتناهی (NaN/∞) به None تبدیل می‌شوند، چون JSON استاندارد
    آن‌ها را ندارد و JSON.parse در مرورگر روی literals خارج از spec می‌شکند.
    """

    row_axis: str
    row: AxisValues
    col: AxisValues
    values: List[List[Optional[float]]]


class AssetResultPayload(BaseModel):
    price: MatrixPayload
    bubble: Optional[MatrixPayload]
    market_price: float


AnalysisResponse = Dict[AssetKey, AssetResultPayload]
