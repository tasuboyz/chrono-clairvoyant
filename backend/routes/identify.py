import config
from flask import Blueprint, request, jsonify
from services.ai_service import identify_watch, generate_description

identify_bp = Blueprint("identify", __name__)


@identify_bp.route("/identify", methods=["POST"])
def identify():
    try:
        body = request.get_json(force=True) or {}
        input_type = body.get("input_type", "image")
        image_b64 = body.get("image_base64")
        text = body.get("text")
        client_key: str | None = body.get("gemini_api_key")

        # Resolve API key — mirrors the Deno edge function priority:
        # 1. OpenRouter (server-side)  2. Gemini (server-side)  3. Client-supplied (demo mode)
        ai_key = (
            config.OPENROUTER_API_KEY
            or config.GEMINI_API_KEY
            or (client_key if not config.OPENROUTER_API_KEY else None)
        )
        if not ai_key:
            return jsonify({"error": "Nessuna API key AI configurata (imposta OPENROUTER_API_KEY o GEMINI_API_KEY)"}), 500

        use_openrouter = bool(config.OPENROUTER_API_KEY)

        watch = identify_watch(
            input_type=input_type,
            image_b64=image_b64,
            text=text,
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )

        description = generate_description(
            brand=watch.get("brand", ""),
            model=watch.get("model", ""),
            reference=watch.get("reference", ""),
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )

        return jsonify({"watch": watch, "description": description})

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
