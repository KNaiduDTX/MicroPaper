"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create wallet_verifications table
    op.create_table(
        'wallet_verifications',
        sa.Column('wallet_address', sa.String(length=42), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('verified_by', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('wallet_address')
    )
    op.create_index(op.f('ix_wallet_verifications_wallet_address'), 'wallet_verifications', ['wallet_address'], unique=False)
    
    # Create note_issuances table
    op.create_table(
        'note_issuances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('isin', sa.String(length=12), nullable=False),
        sa.Column('wallet_address', sa.String(length=42), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('maturity_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('isin')
    )
    op.create_index(op.f('ix_note_issuances_id'), 'note_issuances', ['id'], unique=False)
    op.create_index(op.f('ix_note_issuances_isin'), 'note_issuances', ['isin'], unique=True)
    op.create_index(op.f('ix_note_issuances_wallet_address'), 'note_issuances', ['wallet_address'], unique=False)
    
    # Create compliance_audit_logs table
    op.create_table(
        'compliance_audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('wallet_address', sa.String(length=42), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', sa.String(length=255), nullable=True),
        sa.Column('request_id', sa.String(length=255), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_compliance_audit_logs_id'), 'compliance_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_compliance_audit_logs_wallet_address'), 'compliance_audit_logs', ['wallet_address'], unique=False)
    op.create_index(op.f('ix_compliance_audit_logs_request_id'), 'compliance_audit_logs', ['request_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_compliance_audit_logs_request_id'), table_name='compliance_audit_logs')
    op.drop_index(op.f('ix_compliance_audit_logs_wallet_address'), table_name='compliance_audit_logs')
    op.drop_index(op.f('ix_compliance_audit_logs_id'), table_name='compliance_audit_logs')
    op.drop_table('compliance_audit_logs')
    
    op.drop_index(op.f('ix_note_issuances_wallet_address'), table_name='note_issuances')
    op.drop_index(op.f('ix_note_issuances_isin'), table_name='note_issuances')
    op.drop_index(op.f('ix_note_issuances_id'), table_name='note_issuances')
    op.drop_table('note_issuances')
    
    op.drop_index(op.f('ix_wallet_verifications_wallet_address'), table_name='wallet_verifications')
    op.drop_table('wallet_verifications')

