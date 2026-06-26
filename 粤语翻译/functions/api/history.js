import {
  AppError,
  buildCorsHeaders,
  getTranslationHistory,
  handleOptions,
  jsonResponse,
} from "../_utils/translator.js";

export function onRequestOptions(context) {
  return handleOptions(context.request, context.env);
}

export async function onRequestGet(context) {
  const corsHeaders = buildCorsHeaders(context.request, context.env);

  try {
    const payload = await getTranslationHistory(context.request, context.env);
    return jsonResponse(payload, 200, corsHeaders);
  } catch (error) {
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

export function onRequestPost(context) {
  return jsonResponse(
    { error: { code: "method_not_allowed", message: "仅支持 GET 请求。" } },
    405,
    {
      ...buildCorsHeaders(context.request, context.env),
      allow: "GET, OPTIONS",
    }
  );
}
