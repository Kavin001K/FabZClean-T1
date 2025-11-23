# src/app/api/tracks/schemas.py

from marshmallow import Schema, fields, validate

class TrackSchema(Schema):
    id = fields.Int(dump_only=True)
    order_id = fields.Int(required=True)
    worker_id = fields.Int(allow_none=True)
    action = fields.Str(required=True, validate=validate.Length(max=64))
    note = fields.Str(allow_none=True)
    location = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
