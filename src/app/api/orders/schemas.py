from marshmallow import Schema, fields, validate
from datetime import datetime

class OrderCreateSchema(Schema):
    service_id = fields.Int(required=True)
    pickup_date = fields.DateTime(allow_none=True)
    instructions = fields.Str(allow_none=True)

class OrderUpdateSchema(Schema):
    pickup_date = fields.DateTime(allow_none=True)
    instructions = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(["created", "picked_up", "processing", "completed", "delivered", "cancelled"]), allow_none=True)
