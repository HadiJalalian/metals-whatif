FROM node:20-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY metals_whatif ./metals_whatif
COPY --from=web /web/dist ./web/dist
EXPOSE 8000
CMD ["uvicorn", "metals_whatif.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
