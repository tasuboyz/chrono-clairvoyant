import traceback
from flask import Blueprint, request, jsonify
from services.playwright_service import scrape_market_data

market_bp = Blueprint("market", __name__)


@market_bp.route("/market", methods=["POST"])
def market():
    try:
        body = request.get_json(force=True) or {}
        brand = body.get("brand", "")
        model = body.get("model", "")
        reference = body.get("reference", "")

        if not any([brand, model, reference]):
            return jsonify({"error": "Fornire almeno uno tra brand, model o reference"}), 400

        result = scrape_market_data(brand=brand, model=model, reference=reference)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
