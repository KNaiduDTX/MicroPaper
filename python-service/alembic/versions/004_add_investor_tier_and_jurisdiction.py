"""Add investor tier and jurisdiction to wallet_verifications

Revision ID: 004
Revises: 003
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM type for investor tier
    op.execute("CREATE TYPE investor_tier_enum AS ENUM ('retail', 'accredited', 'institutional')")
    
    # Add new columns to wallet_verifications table
    op.add_column('wallet_verifications', sa.Column('investor_tier', sa.Enum('retail', 'accredited', 'institutional', name='investor_tier_enum'), nullable=True))
    op.add_column('wallet_verifications', sa.Column('jurisdiction', sa.String(length=10), nullable=True))
    
    # Add comments to new columns
    op.execute("COMMENT ON COLUMN wallet_verifications.investor_tier IS 'Investor classification tier (retail, accredited, institutional)'")
    op.execute("COMMENT ON COLUMN wallet_verifications.jurisdiction IS 'Jurisdiction code (e.g., US, SG)'")
    
    # Create indexes for new columns
    op.create_index(op.f('ix_wallet_verifications_investor_tier'), 'wallet_verifications', ['investor_tier'], unique=False)
    op.create_index(op.f('ix_wallet_verifications_jurisdiction'), 'wallet_verifications', ['jurisdiction'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_wallet_verifications_jurisdiction'), table_name='wallet_verifications')
    op.drop_index(op.f('ix_wallet_verifications_investor_tier'), table_name='wallet_verifications')
    
    # Remove columns from wallet_verifications
    op.drop_column('wallet_verifications', 'jurisdiction')
    op.drop_column('wallet_verifications', 'investor_tier')
    
    # Drop ENUM type
    op.execute("DROP TYPE IF EXISTS investor_tier_enum")
