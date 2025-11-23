from flask import jsonify
from typing import Any, Dict, Optional

def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> tuple:
    """Create a standardized success response."""
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code

def error_response(message: str, status_code: int = 400, errors: Optional[Dict] = None) -> tuple:
    """Create a standardized error response."""
    response = {"success": False, "message": message}
    if errors:
        response["errors"] = errors
    return jsonify(response), status_code

def paginated_response(
    items: list,
    page: int = 1,
    per_page: int = 20,
    total: Optional[int] = None
) -> tuple:
    """Create a paginated response."""
    if total is None:
        total = len(items)
    
    return success_response({
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if total > 0 else 0
        }
    })

