## migration script template
% if autogenerate:
    {% autoescape False -%}
    ${imports}
    {% endautoescape %}
% endif

revision = '${up_revision}'
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}

from alembic import op
import sqlalchemy as sa

def upgrade():
${upgrades if autogenerate else "    pass"}

def downgrade():
${downgrades if autogenerate else "    pass"}

