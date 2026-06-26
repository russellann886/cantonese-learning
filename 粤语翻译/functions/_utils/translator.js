const MAX_SOURCE_LENGTH = 500;
const GEMINI_MODEL = "gemini-2.0-flash";
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const REQUEST_TIMEOUT_MS = 20_000;
const DEFAULT_TTS_LOCALE = "yue";
const MAX_TTS_CHUNK_LENGTH = 180;
const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

export class AppError extends Error {
  constructor(code, message, status, options = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.upstreamStatus = options.upstreamStatus || 0;
  }
}

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export function buildCorsHeaders(request, env) {
  const rawAllowedOrigins = String(env.CORS_ALLOWED_ORIGINS || "").trim();
  if (!rawAllowedOrigins) {
    return {};
  }

  const requestOrigin = (request.headers.get("Origin") || "").trim().replace(/\/+$/, "");
  const origins = rawAllowedOrigins
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const headers = {
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400",
  };

  if (origins.includes("*")) {
    headers["access-control-allow-origin"] = "*";
    return headers;
  }

  if (requestOrigin && origins.includes(requestOrigin)) {
    headers["access-control-allow-origin"] = requestOrigin;
    headers.vary = "Origin";
  }

  return headers;
}

export function handleOptions(request, env) {
  return new Response(null, {
    status: 204,
    headers: {
      ...buildCorsHeaders(request, env),
      "cache-control": "no-store",
    },
  });
}

export function getProxyHealth(env) {
  const { provider, apiKey } = resolveProviderConfig(env);
  return {
    ok: true,
    configured: Boolean(apiKey),
    provider: provider || "none",
    history_enabled: Boolean(resolveHistoryDatabase(env)),
    message: "proxy_ready",
  };
}

export async function translateSource(source, env) {
  const normalizedSource = validateText(source);
  const { provider, apiKey } = resolveProviderConfig(env);

  if (!provider || !apiKey) {
    throw new AppError(
      "server_not_configured",
      "服务端未配置可用的翻译上游密钥。",
      503
    );
  }

  try {
    if (provider === "openrouter") {
      return await fetchTranslationFromOpenRouter(normalizedSource, apiKey, env);
    }
    if (provider === "gemini") {
      return await fetchTranslationFromGemini(normalizedSource, apiKey);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new AppError(
        "network_error",
        "连接翻译上游失败，请检查网络后重试。",
        502
      );
    }

    throw new AppError("internal_error", "服务内部出现异常。", 500);
  }

  throw new AppError("server_not_configured", "服务端未配置可用的翻译上游密钥。", 503);
}

export async function synthesizeSpeech(text, request, env) {
  const normalizedText = validateText(text);
  const chunks = splitTextForSpeech(normalizedText);

  try {
    const buffers = [];

    for (const chunk of chunks) {
      const endpoint = new URL("https://translate.google.com/translate_tts");
      endpoint.searchParams.set("ie", "UTF-8");
      endpoint.searchParams.set("client", "tw-ob");
      endpoint.searchParams.set("tl", String(env.TTS_LOCALE || DEFAULT_TTS_LOCALE));
      endpoint.searchParams.set("q", chunk);

      const response = await fetchWithTimeout(endpoint.toString(), {
        method: "GET",
        headers: {
          Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.1",
        },
      });

      if (!response.ok) {
        throw await mapTtsUpstreamHttpError(response);
      }

      const audioBytes = new Uint8Array(await response.arrayBuffer());
      if (!audioBytes.byteLength) {
        throw new AppError(
          "upstream_invalid_response",
          "语音上游返回了不可用的音频。",
          502
        );
      }
      buffers.push(audioBytes);
    }

    const mergedAudio = concatUint8Arrays(buffers);
    const corsHeaders = buildCorsHeaders(request, env);

    return new Response(mergedAudio, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "audio/mpeg",
        "content-length": String(mergedAudio.byteLength),
        "content-disposition": 'inline; filename="cantonese-tts.mp3"',
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new AppError(
        "network_error",
        "连接语音上游失败，请检查网络后重试。",
        502
      );
    }

    throw new AppError("internal_error", "服务内部出现异常。", 500);
  }
}

export async function saveTranslationHistory(source, payload, env) {
  const db = resolveHistoryDatabase(env);
  if (!db) {
    return false;
  }

  const normalizedSource = validateText(source);
  const normalizedPayload = normalizePayload(payload);

  await db
    .prepare(
      `INSERT INTO translation_history (
        source,
        cantonese,
        tone_note,
        reading_version,
        provider
      ) VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(
      normalizedSource,
      normalizedPayload.cantonese,
      normalizedPayload.tone_note,
      normalizedPayload.reading_version,
      resolveProviderConfig(env).provider || "none"
    )
    .run();

  return true;
}

export async function getTranslationHistory(request, env) {
  const db = resolveHistoryDatabase(env);
  if (!db) {
    throw new AppError(
      "database_not_configured",
      "服务端未绑定可用的 D1 数据库。",
      503
    );
  }

  const url = new URL(request.url);
  const limit = parseHistoryLimit(url.searchParams.get("limit"));
  const response = await db
    .prepare(
      `SELECT
        id,
        source,
        cantonese,
        tone_note,
        reading_version,
        provider,
        created_at
      FROM translation_history
      ORDER BY id DESC
      LIMIT ?1`
    )
    .bind(limit)
    .all();

  return {
    items: Array.isArray(response?.results) ? response.results : [],
    limit,
  };
}

function buildPrompt(source) {
  return [
    "请把下面的普通话改写成香港日常口语粤语。",
    "要求：",
    "1. 保留人名、数字、时间、地点、品牌名和引用内容，不要随意改写。",
    "2. 输出必须是 JSON，且只能包含 cantonese、tone_note、reading_version 三个字段。",
    "3. cantonese 为主结果，简洁自然，不要解释。",
    "4. tone_note 为不超过 18 个字的语气说明。",
    "5. reading_version 为适合跟读的版本，不要拼音，不要额外说明。",
    "6. 不要输出 Markdown，不要加代码块。",
    "",
    `原文：${source}`,
  ].join("\n");
}

function resolveProviderConfig(env) {
  const openRouterKey = String(env.OPENROUTER_API_KEY || "").trim();
  if (openRouterKey) {
    return { provider: "openrouter", apiKey: openRouterKey };
  }

  const geminiKey = String(env.GEMINI_API_KEY || "").trim();
  if (geminiKey) {
    return { provider: "gemini", apiKey: geminiKey };
  }

  return { provider: null, apiKey: "" };
}

function resolveHistoryDatabase(env) {
  return env && typeof env === "object" && env.DB ? env.DB : null;
}

function validateText(source) {
  if (typeof source !== "string") {
    throw new AppError(
      "validation_failed",
      `source 必须是 1 到 ${MAX_SOURCE_LENGTH} 字的文本。`,
      400
    );
  }

  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > MAX_SOURCE_LENGTH) {
    throw new AppError(
      "validation_failed",
      `source 必须是 1 到 ${MAX_SOURCE_LENGTH} 字的文本。`,
      400
    );
  }

  return normalized;
}

function parseHistoryLimit(rawValue) {
  if (rawValue == null || rawValue === "") {
    return DEFAULT_HISTORY_LIMIT;
  }

  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new AppError(
      "validation_failed",
      `limit 必须是 1 到 ${MAX_HISTORY_LIMIT} 的整数。`,
      400
    );
  }

  return Math.min(parsed, MAX_HISTORY_LIMIT);
}

function splitTextForSpeech(text) {
  if (text.length <= MAX_TTS_CHUNK_LENGTH) {
    return [text];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > MAX_TTS_CHUNK_LENGTH) {
    const splitIndex = findSpeechBreakIndex(remaining);
    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.filter(Boolean);
}

function findSpeechBreakIndex(text) {
  const chunk = text.slice(0, MAX_TTS_CHUNK_LENGTH + 1);
  const breakChars = ["。", "！", "？", "；", "，", ".", "!", "?", ";", ",", " "];

  let bestIndex = -1;
  for (const char of breakChars) {
    const index = chunk.lastIndexOf(char);
    if (index > bestIndex) {
      bestIndex = index;
    }
  }

  if (bestIndex >= 0) {
    return bestIndex + 1;
  }

  return MAX_TTS_CHUNK_LENGTH;
}

async function fetchTranslationFromGemini(source, apiKey) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "你是一个只负责普通话转地道粤语的翻译助手。输出保持短、稳、可直接使用。",
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: buildPrompt(source) }] }],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw await mapUpstreamHttpError(response);
  }

  const responseData = await response.json();
  const rawText = extractGeminiText(responseData);
  return normalizePayload(parseJsonPayload(rawText));
}

async function fetchTranslationFromOpenRouter(source, apiKey, env) {
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://pages.dev",
      "X-OpenRouter-Title": "Cantonese Translator Cloudflare Pages",
    },
    body: JSON.stringify({
      model: String(env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL),
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是一个只负责普通话转地道粤语的翻译助手。" +
            "输出保持短、稳、可直接使用。" +
            "你必须只返回 JSON，且只能包含 cantonese、tone_note、reading_version 三个字段。",
        },
        { role: "user", content: buildPrompt(source) },
      ],
    }),
  });

  if (!response.ok) {
    throw await mapUpstreamHttpError(response);
  }

  const responseData = await response.json();
  const choices = responseData.choices || [];
  const rawText = String(choices[0]?.message?.content || "").trim();
  if (!rawText) {
    throw new AppError(
      "upstream_invalid_response",
      "上游返回了不可用的翻译结果。",
      502
    );
  }

  return normalizePayload(parseJsonPayload(rawText));
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError" || error instanceof TypeError) {
      throw new AppError(
        "network_error",
        "连接翻译上游失败，请检查网络后重试。",
        502
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapUpstreamHttpError(response) {
  let upstreamMessage = "";

  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const responseData = await response.json();
      upstreamMessage =
        responseData?.error?.message ||
        responseData?.message ||
        "";
    } else {
      upstreamMessage = (await response.text()).trim();
    }
  } catch {
    upstreamMessage = "";
  }

  const normalizedMessage = upstreamMessage.toLowerCase();
  if (
    response.status === 400 &&
    (normalizedMessage.includes("api key not valid") ||
      normalizedMessage.includes("invalid api key") ||
      normalizedMessage.includes("authentication"))
  ) {
    return new AppError(
      "auth_failed",
      "上游认证失败，请检查服务端密钥配置。",
      502,
      { upstreamStatus: response.status }
    );
  }

  if (response.status === 401 || response.status === 403) {
    return new AppError(
      "auth_failed",
      "上游认证失败，请检查服务端密钥配置。",
      502,
      { upstreamStatus: response.status }
    );
  }

  if (response.status === 429) {
    return new AppError(
      "rate_limited",
      "当前上游限流，请稍后再试。",
      502,
      { upstreamStatus: response.status }
    );
  }

  if (response.status >= 500) {
    return new AppError(
      "upstream_unavailable",
      "翻译上游暂时不可用，请稍后重试。",
      502,
      { upstreamStatus: response.status }
    );
  }

  return new AppError(
    "upstream_request_failed",
    upstreamMessage || "请求翻译上游失败。",
    502,
    { upstreamStatus: response.status }
  );
}

async function mapTtsUpstreamHttpError(response) {
  let upstreamMessage = "";

  try {
    upstreamMessage = (await response.text()).trim();
  } catch {
    upstreamMessage = "";
  }

  if (response.status === 429) {
    return new AppError(
      "rate_limited",
      "当前语音上游限流，请稍后再试。",
      502,
      { upstreamStatus: response.status }
    );
  }

  if (response.status >= 500) {
    return new AppError(
      "upstream_unavailable",
      "语音上游暂时不可用，请稍后重试。",
      502,
      { upstreamStatus: response.status }
    );
  }

  return new AppError(
    "upstream_request_failed",
    upstreamMessage || "请求语音上游失败。",
    502,
    { upstreamStatus: response.status }
  );
}

function extractGeminiText(data) {
  const candidates = data?.candidates || [];
  const parts = candidates[0]?.content?.parts || [];
  const text = parts
    .map((part) => String(part?.text || ""))
    .join("")
    .trim();

  if (!text) {
    throw new AppError(
      "upstream_invalid_response",
      "上游返回了不可用的翻译结果。",
      502
    );
  }

  return text;
}

function parseJsonPayload(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new AppError(
        "upstream_invalid_response",
        "上游返回了不可用的翻译结果。",
        502
      );
    }

    try {
      return JSON.parse(rawText.slice(start, end + 1));
    } catch {
      throw new AppError(
        "upstream_invalid_response",
        "上游返回了不可用的翻译结果。",
        502
      );
    }
  }
}

function normalizePayload(payload) {
  const cantonese =
    typeof payload?.cantonese === "string" ? payload.cantonese.trim() : "";
  const toneNote =
    typeof payload?.tone_note === "string" ? payload.tone_note.trim() : "";
  const readingVersion =
    typeof payload?.reading_version === "string"
      ? payload.reading_version.trim()
      : "";

  if (!cantonese || !toneNote || !readingVersion) {
    throw new AppError(
      "upstream_invalid_response",
      "上游返回了不可用的翻译结果。",
      502
    );
  }

  return {
    cantonese,
    tone_note: toneNote,
    reading_version: readingVersion,
  };
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}
