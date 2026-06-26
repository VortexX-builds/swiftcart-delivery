/** All times are milliseconds after order.created_at */
export const SIM_PREPARING_MS  = 10_000;  // 10s  → "Preparing" label
export const SIM_ON_THE_WAY_MS = 25_000;  // 25s  → driver starts moving; DB → 'processing'
export const SIM_DELIVERED_MS  = 75_000;  // 75s  → DB → 'delivered'; notification fires (~1.25 min total)
