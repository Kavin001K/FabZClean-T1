from marshmallow import Schema, fields, validate, ValidationError

class RegistrationSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=128))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    phone = fields.Str(validate=validate.Length(max=32), allow_none=True)

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class RefreshSchema(Schema):
    refresh_token = fields.Str(required=True)

