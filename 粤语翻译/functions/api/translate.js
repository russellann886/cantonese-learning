import {
  AppError,
  buildCorsHeaders,
  handleOptions,
  jsonResponse,
  translateSource,
} from "../_utils/translator.js";

export function onRequestOptions(context) {
  return handleOptions(context.request, context.env);
}

export async function onRequestPost(context) {
  const corsHeaders = buildCorsHeaders(context.request, context.env);

  try {
    const body = await context.request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("invalid_json_body", "请求体必须是合法 JSON。", 400);
    }

    const payload = await translateSource(body.source, context.env);
    return jsonResponse(payload, 200, corsHeaders);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse(
        { error: { code: "invalid_json_body", message: "请求体必须是合法 JSON。" } },
        400,
        corsHeaders
      );
    }

    if (error instanceof AppError) {
      return jsonResponse(
        { error: { code: error.code, message: error.message } },
        error.status,
        corsHeaders
      );
    }

    return jsonResponse(
      { error: { code: "internal_error", message: "服务内部出现异常。" } },
      500,
      corsHeaders
    );
  }
}

export function onRequestGet(context) {
  return jsonResponse(
    { error: { code: "method_not_allowed", message: "仅支持 POST 请求。" } },
    405,
    {
      ...buildCorsHeaders(context.request, context.env),
      allow: "POST, OPTIONS",
    }
  );
}
