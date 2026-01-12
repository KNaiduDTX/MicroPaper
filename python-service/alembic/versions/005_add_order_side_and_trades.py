"""Add order side and create trades table for secondary market

Revision ID: 005
Revises: 004
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM type for order side
    op.execute("CREATE TYPE order_side_enum AS ENUM ('buy', 'sell')")
    
    # Add side column to orders table (default to 'buy' for existing records)
    op.add_column('orders', sa.Column('side', sa.Enum('buy', 'sell', name='order_side_enum'), nullable=True))
    
    # Set default value for existing records
    op.execute("UPDATE orders SET side = 'buy' WHERE side IS NULL")
    
    # Make side column NOT NULL after setting defaults
    op.alter_column('orders', 'side', nullable=False, server_default='buy')
    
    # Add price column to orders (for limit orders in secondary market)
    op.add_column('orders', sa.Column('price', sa.Integer(), nullable=True))
    op.execute("COMMENT ON COLUMN orders.price IS 'Price per unit in cents (for limit orders)'")
    
    # Create trades table for executed trades
    op.create_table(
        'trades',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('buyer_wallet', sa.String(length=42), nullable=False),
        sa.Column('seller_wallet', sa.String(length=42), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, comment='Trade quantity in cents'),
        sa.Column('price', sa.Integer(), nullable=False, comment='Price per unit in cents'),
        sa.Column('buy_order_id', sa.Integer(), nullable=True),
        sa.Column('sell_order_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['buy_order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sell_order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['note_id'], ['note_issuances.id'], ondelete='CASCADE')
    )
    op.execute("COMMENT ON TABLE trades IS 'Executed trades in the secondary market'")
    op.execute("COMMENT ON COLUMN trades.quantity IS 'Trade quantity in cents'")
    op.execute("COMMENT ON COLUMN trades.price IS 'Price per unit in cents'")
    
    # Create indexes for trades
    op.create_index(op.f('ix_trades_id'), 'trades', ['id'], unique=False)
    op.create_index(op.f('ix_trades_note_id'), 'trades', ['note_id'], unique=False)
    op.create_index(op.f('ix_trades_buyer_wallet'), 'trades', ['buyer_wallet'], unique=False)
    op.create_index(op.f('ix_trades_seller_wallet'), 'trades', ['seller_wallet'], unique=False)
    op.create_index(op.f('ix_trades_timestamp'), 'trades', ['timestamp'], unique=False)
    op.create_index(op.f('ix_trades_buy_order_id'), 'trades', ['buy_order_id'], unique=False)
    op.create_index(op.f('ix_trades_sell_order_id'), 'trades', ['sell_order_id'], unique=False)
    
    # Create indexes for orders
    op.create_index(op.f('ix_orders_side'), 'orders', ['side'], unique=False)
    op.create_index(op.f('ix_orders_price'), 'orders', ['price'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_orders_price'), table_name='orders')
    op.drop_index(op.f('ix_orders_side'), table_name='orders')
    op.drop_index(op.f('ix_trades_sell_order_id'), table_name='trades')
    op.drop_index(op.f('ix_trades_buy_order_id'), table_name='trades')
    op.drop_index(op.f('ix_trades_timestamp'), table_name='trades')
    op.drop_index(op.f('ix_trades_seller_wallet'), table_name='trades')
    op.drop_index(op.f('ix_trades_buyer_wallet'), table_name='trades')
    op.drop_index(op.f('ix_trades_note_id'), table_name='trades')
    op.drop_index(op.f('ix_trades_id'), table_name='trades')
    
    # Drop trades table
    op.drop_table('trades')
    
    # Remove columns from orders
    op.drop_column('orders', 'price')
    op.drop_column('orders', 'side')
    
    # Drop ENUM type
    op.execute("DROP TYPE IF EXISTS order_side_enum")
