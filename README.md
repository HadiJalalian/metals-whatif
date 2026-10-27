# Metals What-if · فلزات چه‌اگر

**EN** — An interactive dashboard that builds two-dimensional sensitivity matrices (fair value and price bubble) for the Iranian metals market: 18k gold, mazaneh, raw silver 999, and deposit certificates for silver, copper cathode and zinc ingot. Every cell answers a *what-if*: what happens to fair value if the free-market dollar and the world ounce move together?

**فارسی** — داشبورد تعاملی ماتریس حساسیت قیمت (دلار آزاد × قیمت جهانی) و ماتریس حباب برای طلای ۱۸ عیار، مظنه، نقره ۹۹۹، گواهی سپرده شمش نقره، گواهی سپرده مس کاتد و گواهی سپرده شمش روی.

---

## Architecture

The calculation core is pure Python + NumPy and has no UI dependency. Three surfaces consume it:

```
metals_whatif/
  core/      pure pricing formulas, scenario axes, 2-D matrices, lru_cache
  api/       FastAPI contract over core (Pydantic schemas, JSON serialisation)
  ui/        legacy Streamlit dashboard (app.py)
web/         React + TypeScript + Tailwind front-end
```

| Layer | Responsibility |
| --- | --- |
| `core` | formulas only — no Streamlit, no FastAPI, no formatting |
| `api` | validation, `DashboardInputs` ↔ JSON, non-finite → `null` |
| `web` | all labels, locale, number formatting, colour scales |

The API ships **raw numbers**. The browser owns formatting, so one endpoint serves both
English (`en-US`) and Persian (`fa-IR`) output, including Persian digits.

## Quick start

### Web app (recommended)

```bash
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# terminal 1 — calculation API
uvicorn metals_whatif.api.main:app --reload --port 8000

# terminal 2 — front-end (proxies /api to :8000)
cd web && npm install && npm run dev
```

Open <http://localhost:5173>.

### Single server (production shape)

Build the front-end first; FastAPI then serves `web/dist` and the API from one origin,
so no CORS configuration is needed:

```bash
cd web && npm run build && cd ..
uvicorn metals_whatif.api.main:app --host 0.0.0.0 --port 8000
```

```bash
docker build -t metals-whatif .
docker run -p 8000:8000 metals-whatif
```

### Legacy Streamlit UI

```bash
pip install -r requirements-ui.txt
streamlit run app.py
```

## Deploy

**Vercel** — `vercel.json` + `pyproject.toml` are configured so one project serves the
built front-end from the CDN and `/api/*` from a Python function (same origin, no CORS).
Validate the pipeline before the first production deploy:

```bash
npx vercel build     # runs install + build locally, without deploying
npx vercel deploy --prebuilt
```

**Any container host** — `docker build -t metals-whatif .` then expose port `8000`.

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

`tests/test_api.py` pins the HTTP contract: schema validation, axis mapping, structured
`empty_axes` errors, and byte-for-byte equality between the JSON payload and `run_analysis`.

## Model assumptions

- Each copper/zinc certificate = 1 kg; value = `LME × USD × (1 + α) / 1000`
- Each silver certificate (`CD1SIB0001`) = 1 g; value = `(silver ounce ÷ 31.1034) × USD × (1 + α)`
- The silver certificate shares the ounce axis with raw silver, but its premium `α` is
  independent of the "raw silver bubble" input.
- VAT and trading fees (when enabled) apply as one additive factor
  `1 + (VAT + fee)/100`. Default VAT is 10% for copper and zinc, 0% for the silver certificate.
- Storage costs and physical-delivery assessment fees are **not** modelled.
- All prices are in Toman. The commodity board quotes in Rials — divide by 10.

## Disclaimer

**EN** This tool is computational and educational. It is not investment advice.
**فارسی** این ابزار صرفاً محاسباتی و آموزشی است و توصیه‌ی سرمایه‌گذاری نیست.

## License

MIT
