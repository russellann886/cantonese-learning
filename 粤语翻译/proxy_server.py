#!/usr/bin/env python3
import json
import os
import socket
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional, Tuple
from urllib import error, parse, request


SCRIPT_DIR = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8080"))
MAX_SOURCE_LENGTH = 500
GEMINI_MODEL = "gemini-2.0-flash"
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openrouter/free")
REQUEST_TIMEOUT_SECONDS = 20
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()


def build_prompt(source: str) -> str:
    return "\n".join(
        [
            "请把下面的普通话改写成香港日常口语粤语。",
            "要求：",
            "1. 保留人名、数字、时间、地点、品牌名和引用内容，不要随意改写。",
            "2. 输出必须是 JSON，且只能包含 cantonese、tone_note、reading_version 三个字段。",
            "3. cantonese 为主结果，简洁自然，不要解释。",
            "4. tone_note 为不超过 18 个字的语气说明。",
            "5. reading_version 为适合跟读的版本，不要拼音，不要额外说明。",
            "6. 不要输出 Markdown，不要加代码块。",
            "",
            f"原文：{source}",
        ]
    )


def extract_text_from_response(data: dict) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    return "".join(part.get("text", "") for part in parts).strip()


def parse_gemini_payload(raw_text: str) -> dict:
    if not raw_text:
        raise ValueError("empty_response")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("invalid_json") from None
        return json.loads(raw_text[start : end + 1])


def normalize_payload(payload: dict) -> dict:
    cantonese = payload.get("cantonese", "").strip() if isinstance(payload.get("cantonese"), str) else ""
    tone_note = payload.get("tone_note", "").strip() if isinstance(payload.get("tone_note"), str) else ""
    reading_version = (
        payload.get("reading_version", "").strip()
        if isinstance(payload.get("reading_version"), str)
        else ""
    )
    if not cantonese or not tone_note or not reading_version:
        raise ValueError("invalid_payload")
    return {
        "cantonese": cantonese,
        "tone_note": tone_note,
        "reading_version": reading_version,
    }


def resolve_provider_config() -> Tuple[Optional[str], str]:
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if openrouter_key:
        return "openrouter", openrouter_key

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        return "gemini", gemini_key

    return None, ""


def resolve_allowed_origins() -> Tuple[bool, set]:
    if not CORS_ALLOWED_ORIGINS:
        return False, set()

    origins = {
        item.strip().rstrip("/")
        for item in CORS_ALLOWED_ORIGINS.split(",")
        if item.strip()
    }
    if "*" in origins:
        return True, set()
    return False, origins


def fetch_translation_from_gemini(source: str, api_key: str) -> dict:
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={parse.quote(api_key)}"
    )
    payload = {
        "systemInstruction": {
            "parts": [
                {
                    "text": "你是一个只负责普通话转地道粤语的翻译助手。输出保持短、稳、可直接使用。"
                }
            ]
        },
        "contents": [{"role": "user", "parts": [{"text": build_prompt(source)}]}],
        "generationConfig": {"temperature": 0.65, "responseMimeType": "application/json"},
    }
    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    raw_text = extract_text_from_response(response_data)
    return normalize_payload(parse_gemini_payload(raw_text))


def fetch_translation_from_openrouter(source: str, api_key: str) -> dict:
    endpoint = "https://openrouter.ai/api/v1/chat/completions"
    system_prompt = (
        "你是一个只负责普通话转地道粤语的翻译助手。"
        "输出保持短、稳、可直接使用。"
        "你必须只返回 JSON，且只能包含 cantonese、tone_note、reading_version 三个字段。"
    )
    payload = {
        "model": OPENROUTER_MODEL,
        "temperature": 0.65,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": build_prompt(source)},
        ],
    }
    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost",
            "X-OpenRouter-Title": "Cantonese Translator Local Preview",
        },
        method="POST",
    )

    with request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        response_data = json.loads(response.read().decode("utf-8"))

    choices = response_data.get("choices") or []
    if not choices:
        raise ValueError("empty_response")

    message = choices[0].get("message") or {}
    raw_text = message.get("content", "").strip()
    return normalize_payload(parse_gemini_payload(raw_text))


def fetch_translation(source: str, provider: str, api_key: str) -> dict:
    if provider == "openrouter":
        return fetch_translation_from_openrouter(source, api_key)
    if provider == "gemini":
        return fetch_translation_from_gemini(source, api_key)
    raise ValueError("server_not_configured")


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SCRIPT_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        super().log_message(fmt, *args)

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            self._write_cors_headers()
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_GET(self):
        if self.path == "/api/health":
            provider, api_key = resolve_provider_config()
            return self._write_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "configured": bool(api_key),
                    "provider": provider or "none",
                    "message": "proxy_ready",
                },
            )
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/translate":
            return self._write_json(
                HTTPStatus.NOT_FOUND,
                {"error": {"code": "not_found", "message": "未找到可用接口。"}},
            )

        try:
            body = self._read_json_body()
            source = self._validate_source(body)
            provider, api_key = resolve_provider_config()
            if not provider or not api_key:
                return self._write_json(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    {
                        "error": {
                            "code": "server_not_configured",
                            "message": "服务端未配置可用的翻译上游密钥。",
                        }
                    },
                )

            payload = fetch_translation(source, provider, api_key)
            return self._write_json(HTTPStatus.OK, payload)
        except ValueError as exc:
            code = str(exc)
            if code == "invalid_json_body":
                return self._write_json(
                    HTTPStatus.BAD_REQUEST,
                    {"error": {"code": "invalid_json_body", "message": "请求体必须是合法 JSON。"}},
                )
            if code == "validation_failed":
                return self._write_json(
                    HTTPStatus.BAD_REQUEST,
                    {
                        "error": {
                            "code": "validation_failed",
                            "message": f"source 必须是 1 到 {MAX_SOURCE_LENGTH} 字的文本。",
                        }
                    },
                )
            if code in {"empty_response", "invalid_json", "invalid_payload"}:
                return self._write_json(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "code": "upstream_invalid_response",
                            "message": "上游返回了不可用的翻译结果。",
                        }
                    },
                )
            return self._write_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": {"code": "internal_error", "message": "服务内部出现异常。"}},
            )
        except error.HTTPError as exc:
            status = exc.code
            upstream_message = ""
            try:
                upstream_data = json.loads(exc.read().decode("utf-8"))
                upstream_message = (
                    upstream_data.get("error", {}).get("message", "")
                    if isinstance(upstream_data, dict)
                    else ""
                )
            except Exception:
                upstream_message = ""

            normalized_message = upstream_message.lower()
            if status == 400 and (
                "api key not valid" in normalized_message
                or "invalid api key" in normalized_message
                or "authentication" in normalized_message
            ):
                return self._write_json(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "code": "auth_failed",
                            "message": "上游认证失败，请检查服务端密钥配置。",
                        }
                    },
                )
            if status in {401, 403}:
                return self._write_json(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "code": "auth_failed",
                            "message": "上游认证失败，请检查服务端密钥配置。",
                        }
                    },
                )
            if status == 429:
                return self._write_json(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "code": "rate_limited",
                            "message": "当前上游限流，请稍后再试。",
                        }
                    },
                )
            if status >= 500:
                return self._write_json(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "code": "upstream_unavailable",
                            "message": "翻译上游暂时不可用，请稍后重试。",
                        }
                    },
                )
            return self._write_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": {
                        "code": "upstream_request_failed",
                        "message": upstream_message or "请求翻译上游失败。",
                    }
                },
            )
        except (error.URLError, TimeoutError, socket.timeout):
            return self._write_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": {
                        "code": "network_error",
                        "message": "连接翻译上游失败，请检查网络后重试。",
                    }
                },
            )
        except Exception:
            return self._write_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": {"code": "internal_error", "message": "服务内部出现异常。"}},
            )

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
        if not raw_body:
            raise ValueError("invalid_json_body")
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise ValueError("invalid_json_body") from exc
        if not isinstance(data, dict):
            raise ValueError("invalid_json_body")
        return data

    def _validate_source(self, body: dict) -> str:
        source = body.get("source", "")
        if not isinstance(source, str):
            raise ValueError("validation_failed")
        normalized = " ".join(source.split()).strip()
        if not normalized or len(normalized) > MAX_SOURCE_LENGTH:
            raise ValueError("validation_failed")
        return normalized

    def _write_json(self, status: HTTPStatus, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._write_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _write_cors_headers(self):
        allow_all, allowed_origins = resolve_allowed_origins()
        request_origin = (self.headers.get("Origin") or "").strip().rstrip("/")

        if allow_all:
            self.send_header("Access-Control-Allow-Origin", "*")
        elif request_origin and request_origin in allowed_origins:
            self.send_header("Access-Control-Allow-Origin", request_origin)
            self.send_header("Vary", "Origin")

        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")


def main():
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Preview server running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
