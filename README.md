# MetalCast · مِتال‌کست

**EN** — MetalCast computes the fair value of the Iranian metals market — 18k gold, mazaneh,
raw silver 999 and commodity-exchange deposit certificates for silver, copper cathode and zinc
ingot — across every combination of free-market dollar and world price you choose. Each cell
answers one question: *if the dollar and the ounce move like this, what should this metal cost,
and how far is the board from that number?*

**فارسی** — مِتال‌کست ارزش ذاتی هر گرم طلای ۱۸ عیار، مظنه، نقره ۹۹۹ و گواهی سپرده مس و روی را
در تمام ترکیب‌های دلار آزاد و قیمت جهانی می‌سازد و فاصله تابلوی بازار از آن ارزش را نشان می‌دهد.

**Live / آنلاین** — <https://metalcast-nu.vercel.app>

## The interface

| | |
| --- | --- |
| **Bilingual, natively** | English and Persian (RTL) share one code path; the API ships raw numbers, so `Intl` owns digits, separators and direction. |
| **Two matrices per asset** | Fair-value grid plus a symmetric bubble grid (green = board below model, red = above). |
| **Pin any cell** | Hover or click a cell and the grid spells the scenario out in one sentence — dollar, ounce, modelled price, and the gap to the board. |
| **Impact profile** | A one-glance bar chart of the USD axis at the base row, on the same colour scale as the grid. |
| **Density presets** | Quick 5×5, standard 9×9 or fine 17×17 sweeps without touching five inputs. |
| **Shareable scenarios** | "Copy scenario link" puts the whole input set in the URL — no accounts, no database. |
| **Keyboard and screen reader** | Arrow-key grid cursor, Enter to pin, Esc to release, live read-out region, `prefers-reduced-motion` respected. |


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

**Vercel** — one project, one origin: the FastAPI preset loads `metals_whatif.api.main:app`
(from `[tool.vercel.entrypoint]`) as a single function, and the `web/dist` mount is promoted
to the CDN at build time, so the front-end never passes through Python. `excludeFiles` keeps
`node_modules` and the test suite out of the bundle. Pushes to `main` deploy automatically.

```bash
npx vercel pull --yes --environment=production   # required before a local build
npx vercel build --prod                          # validates the pipeline without deploying
npx vercel deploy --prod
```

Two ways this pipeline fails, both from the preset being lost:

- `"framework": null` in `vercel.json` overrides the preset, and the generic builder then
  rejects the entrypoint with *"doesn't match any Serverless Functions inside the `api`
  directory"*.
- Importing the repo as a **Vite** project (the dashboard offers it, because of `web/`)
  leaves `pip install` against the image's uv-managed Python → PEP 668
  `externally-managed-environment`. The project must use the **FastAPI** preset, with
  `web/` as a subdirectory of the same project rather than a project of its own.

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
