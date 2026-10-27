import type { AnalysisRequest } from "./api";

const PARAM = "s";

function toBase64(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64(code: string): string {
  const padded = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeRequest(request: AnalysisRequest): string {
  return toBase64(JSON.stringify(request));
}

/** لینک قابل اشتراک: فقط سناریو را در query می‌برد، بدون سرور و بدون کوکی. */
export function shareUrl(request: AnalysisRequest): string {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, encodeRequest(request));
  url.hash = "";
  return url.toString();
}

export function readRequestFromLocation(): Partial<AnalysisRequest> | null {
  const code = new URLSearchParams(window.location.search).get(PARAM);
  if (!code) return null;
  try {
    const parsed = JSON.parse(fromBase64(code)) as unknown;
    if (parsed === null || typeof parsed !== "object") return null;
    return parsed as Partial<AnalysisRequest>;
  } catch {
    return null;
  }
}
