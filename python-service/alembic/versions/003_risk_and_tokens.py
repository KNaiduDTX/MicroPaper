"""Risk Management Framework and Dual-Format Support

Revision ID: 003
Revises: 002
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types for new tables
    op.execute("CREATE TYPE asset_type_enum AS ENUM ('cash', 'receivables', 'inventory')")
    op.execute("CREATE TYPE collateral_status_enum AS ENUM ('active', 'liquidated')")
    op.execute("CREATE TYPE guarantor_type_enum AS ENUM ('personal', 'bank', 'sba', 'insurance_pool')")
    op.execute("CREATE TYPE enforcement_status_enum AS ENUM ('active', 'triggered')")
    
    # Add new columns to note_issuances table
    op.add_column('note_issuances', sa.Column('smart_contract_address', sa.String(length=42), nullable=True, comment='On-chain token smart contract address'))
    op.add_column('note_issuances', sa.Column('risk_score', sa.String(length=10), nullable=True, comment='Issuer credit grade (e.g., A, B-, C+)'))
    
    # Create indexes for new columns
    op.create_index(op.f('ix_note_issuances_smart_contract_address'), 'note_issuances', ['smart_contract_address'], unique=False)
    op.create_index(op.f('ix_note_issuances_risk_score'), 'note_issuances', ['risk_score'], unique=False)
    
    # Create collateral_assets table
    op.create_table(
        'collateral_assets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('asset_type', sa.Enum('cash', 'receivables', 'inventory', name='asset_type_enum'), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('valuation_cents', sa.BigInteger(), nullable=False, comment='Valuation in cents'),
        sa.Column('status', sa.Enum('active', 'liquidated', name='collateral_status_enum'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_collateral_assets_id'), 'collateral_assets', ['id'], unique=False)
    op.create_index(op.f('ix_collateral_assets_note_id'), 'collateral_assets', ['note_id'], unique=False)
    op.create_index(op.f('ix_collateral_assets_status'), 'collateral_assets', ['status'], unique=False)
    
    # Create guarantees table
    op.create_table(
        'guarantees',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('guarantor_type', sa.Enum('personal', 'bank', 'sba', 'insurance_pool', name='guarantor_type_enum'), nullable=False),
        sa.Column('guarantor_name', sa.String(length=255), nullable=False),
        sa.Column('coverage_percent', sa.Integer(), nullable=False, comment='Coverage percentage (0-100)'),
        sa.Column('enforcement_status', sa.Enum('active', 'triggered', name='enforcement_status_enum'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE'),
        sa.CheckConstraint('coverage_percent >= 0 AND coverage_percent <= 100', name='check_coverage_percent_range')
    )
    op.create_index(op.f('ix_guarantees_id'), 'guarantees', ['id'], unique=False)
    op.create_index(op.f('ix_guarantees_note_id'), 'guarantees', ['note_id'], unique=False)
    op.create_index(op.f('ix_guarantees_enforcement_status'), 'guarantees', ['enforcement_status'], unique=False)
    
    # Create insurance_pool_contributions table
    op.create_table(
        'insurance_pool_contributions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('amount_cents', sa.BigInteger(), nullable=False, comment='Contribution amount in cents'),
        sa.Column('contribution_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_insurance_pool_contributions_id'), 'insurance_pool_contributions', ['id'], unique=False)
    op.create_index(op.f('ix_insurance_pool_contributions_note_id'), 'insurance_pool_contributions', ['note_id'], unique=False)
    op.create_index(op.f('ix_insurance_pool_contributions_contribution_date'), 'insurance_pool_contributions', ['contribution_date'], unique=False)


def downgrade() -> None:
    # Drop insurance_pool_contributions table
    op.drop_index(op.f('ix_insurance_pool_contributions_contribution_date'), table_name='insurance_pool_contributions')
    op.drop_index(op.f('ix_insurance_pool_contributions_note_id'), table_name='insurance_pool_contributions')
    op.drop_index(op.f('ix_insurance_pool_contributions_id'), table_name='insurance_pool_contributions')
    op.drop_table('insurance_pool_contributions')
    
    # Drop guarantees table
    op.drop_index(op.f('ix_guarantees_enforcement_status'), table_name='guarantees')
    op.drop_index(op.f('ix_guarantees_note_id'), table_name='guarantees')
    op.drop_index(op.f('ix_guarantees_id'), table_name='guarantees')
    op.drop_table('guarantees')
    
    # Drop collateral_assets table
    op.drop_index(op.f('ix_collateral_assets_status'), table_name='collateral_assets')
    op.drop_index(op.f('ix_collateral_assets_note_id'), table_name='collateral_assets')
    op.drop_index(op.f('ix_collateral_assets_id'), table_name='collateral_assets')
    op.drop_table('collateral_assets')
    
    # Remove columns from note_issuances
    op.drop_index(op.f('ix_note_issuances_risk_score'), table_name='note_issuances')
    op.drop_index(op.f('ix_note_issuances_smart_contract_address'), table_name='note_issuances')
    op.drop_column('note_issuances', 'risk_score')
    op.drop_column('note_issuances', 'smart_contract_address')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS enforcement_status_enum")
    op.execute("DROP TYPE IF EXISTS guarantor_type_enum")
    op.execute("DROP TYPE IF EXISTS collateral_status_enum")
    op.execute("DROP TYPE IF EXISTS asset_type_enum")
