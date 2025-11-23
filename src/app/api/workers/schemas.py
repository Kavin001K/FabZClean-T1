# src/app/api/workers/schemas.py

from marshmallow import Schema, fields, validate, validates, ValidationError

class WorkerSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(max=128))
    email = fields.Email(allow_none=True)
    token = fields.Str(allow_none=True, dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class WorkerCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(max=128))
    email = fields.Email(required=False, allow_none=True)

class WorkerAuthSchema(Schema):
    token = fields.Str(required=True)
