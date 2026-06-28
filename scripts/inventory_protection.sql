-- 1. Add CHECK constraint
ALTER TABLE products ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);

-- 2. Update process_checkout RPC
CREATE OR REPLACE FUNCTION process_checkout(
    p_user_id UUID,
    p_cart_items JSONB,
    p_total_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
    new_order_id UUID;
    item RECORD;
    current_stock INT;
BEGIN
    -- Create the new order
    INSERT INTO orders (user_id, total_amount, status)
    VALUES (p_user_id, p_total_amount, 'pending')
    RETURNING id INTO new_order_id;

    -- Process each item in the cart
    FOR item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(id UUID, quantity INT, price NUMERIC)
    LOOP
        -- Lock the specific product row for update to prevent race conditions
        SELECT stock INTO current_stock FROM products WHERE id = item.id FOR UPDATE;

        -- Check if requested quantity exceeds available stock
        IF current_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for item %', item.id;
        END IF;

        -- Update the product stock
        UPDATE products SET stock = stock - item.quantity WHERE id = item.id;

        -- Insert the order item
        INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
        VALUES (new_order_id, item.id, item.quantity, item.price);
    END LOOP;

    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;
