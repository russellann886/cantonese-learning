import {
  buildCorsHeaders,
  getProxyHealth,
  handleOptions,
  jsonResponse,
} from "../_utils/translator.js";

export function onRequestOptions(context) {
  return handleOptions(context.request, context.env);
}

export function onRequestGet(context) {
  return jsonResponse(getProxyHealth(context.env), 200, buildCorsHeaders(context.request, context.env));
}
