from marshmallow import Schema, fields, validate

class ServiceSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=128))
    price = fields.Decimal(required=True, places=2)
    duration_minutes = fields.Int(allow_none=True)
    status = fields.Str(validate=validate.OneOf(["active", "inactive"]), missing="active")
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ServiceCreateSchema(ServiceSchema):
    pass

class ServiceUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=128))
    price = fields.Decimal(places=2)
    duration_minutes = fields.Int(allow_none=True)
    status = fields.Str(validate=validate.OneOf(["active", "inactive"]))

