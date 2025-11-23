# src/app/api/customers/schemas.py

from marshmallow import Schema, fields, validate, validates, ValidationError

class CustomerSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    email = fields.Email(required=True)
    phone = fields.Str(allow_none=True)
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

class CustomerCreateSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=1, max=128))
    email = fields.Email(required=False)
    phone = fields.Str(required=False, allow_none=True, validate=validate.Length(max=32))
    password = fields.Str(required=False, load_only=True, validate=validate.Length(min=6))

    @validates("password")
    def validate_password(self, v):
        if v and len(v) < 6:
            raise ValidationError("Password must be at least 6 characters.")
