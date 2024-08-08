"""empty message

Revision ID: fc471fe60f7e
Revises: 
Create Date: 2024-08-04 12:31:40.840622

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fc471fe60f7e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('ebook_issued', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('bought', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('ebook_issued', schema=None) as batch_op:
        batch_op.drop_column('bought')
        batch_op.drop_column('status')

    # ### end Alembic commands ###