"""Settlement Layer - Add trading and settlement functionality

Revision ID: 002
Revises: 001
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types for currency and offering_status
    op.execute("CREATE TYPE currency_enum AS ENUM ('USD', 'USDC')")
    op.execute("CREATE TYPE offering_status_enum AS ENUM ('open', 'closed', 'settled')")
    op.execute("CREATE TYPE order_status_enum AS ENUM ('pending', 'filled', 'cancelled', 'rejected')")
    
    # Add new columns to note_issuances table
    op.add_column('note_issuances', sa.Column('interest_rate_bps', sa.Integer(), nullable=True))
    op.add_column('note_issuances', sa.Column('currency', sa.Enum('USD', 'USDC', name='currency_enum'), nullable=True))
    op.add_column('note_issuances', sa.Column('min_subscription_amount', sa.Integer(), nullable=True))
    op.add_column('note_issuances', sa.Column('offering_status', sa.Enum('open', 'closed', 'settled', name='offering_status_enum'), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE note_issuances SET interest_rate_bps = 0 WHERE interest_rate_bps IS NULL")
    op.execute("UPDATE note_issuances SET currency = 'USD' WHERE currency IS NULL")
    op.execute("UPDATE note_issuances SET min_subscription_amount = 10000 WHERE min_subscription_amount IS NULL")
    op.execute("UPDATE note_issuances SET offering_status = 'closed' WHERE offering_status IS NULL")
    
    # Make columns NOT NULL after setting defaults
    op.alter_column('note_issuances', 'interest_rate_bps', nullable=False)
    op.alter_column('note_issuances', 'currency', nullable=False)
    op.alter_column('note_issuances', 'min_subscription_amount', nullable=False)
    op.alter_column('note_issuances', 'offering_status', nullable=False)
    
    # Create investor_holdings table
    op.create_table(
        'investor_holdings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('wallet_address', sa.String(length=42), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('quantity_held', sa.Integer(), nullable=False, comment='Amount held in cents'),
        sa.Column('acquisition_price', sa.Integer(), nullable=False, comment='Price per unit in cents'),
        sa.Column('acquired_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['wallet_address'], ['wallet_verifications.wallet_address'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_investor_holdings_id'), 'investor_holdings', ['id'], unique=False)
    op.create_index(op.f('ix_investor_holdings_wallet_address'), 'investor_holdings', ['wallet_address'], unique=False)
    op.create_index(op.f('ix_investor_holdings_note_id'), 'investor_holdings', ['note_id'], unique=False)
    op.create_index('ix_investor_holdings_wallet_note', 'investor_holdings', ['wallet_address', 'note_id'], unique=False)
    
    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('investor_wallet', sa.String(length=42), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False, comment='Order amount in cents'),
        sa.Column('status', sa.Enum('pending', 'filled', 'cancelled', 'rejected', name='order_status_enum'), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('filled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('request_id', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['investor_wallet'], ['wallet_verifications.wallet_address'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)
    op.create_index(op.f('ix_orders_investor_wallet'), 'orders', ['investor_wallet'], unique=False)
    op.create_index(op.f('ix_orders_note_id'), 'orders', ['note_id'], unique=False)
    op.create_index(op.f('ix_orders_status'), 'orders', ['status'], unique=False)
    op.create_index('ix_orders_note_status', 'orders', ['note_id', 'status'], unique=False)


def downgrade() -> None:
    # Drop orders table
    op.drop_index('ix_orders_note_status', table_name='orders')
    op.drop_index(op.f('ix_orders_status'), table_name='orders')
    op.drop_index(op.f('ix_orders_note_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_investor_wallet'), table_name='orders')
    op.drop_index(op.f('ix_orders_id'), table_name='orders')
    op.drop_table('orders')
    
    # Drop investor_holdings table
    op.drop_index('ix_investor_holdings_wallet_note', table_name='investor_holdings')
    op.drop_index(op.f('ix_investor_holdings_note_id'), table_name='investor_holdings')
    op.drop_index(op.f('ix_investor_holdings_wallet_address'), table_name='investor_holdings')
    op.drop_index(op.f('ix_investor_holdings_id'), table_name='investor_holdings')
    op.drop_table('investor_holdings')
    
    # Remove columns from note_issuances
    op.drop_column('note_issuances', 'offering_status')
    op.drop_column('note_issuances', 'min_subscription_amount')
    op.drop_column('note_issuances', 'currency')
    op.drop_column('note_issuances', 'interest_rate_bps')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS order_status_enum")
    op.execute("DROP TYPE IF EXISTS offering_status_enum")
    op.execute("DROP TYPE IF EXISTS currency_enum")
