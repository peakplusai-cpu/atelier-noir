-- Dual price: optional original (list) price beside sale price.
alter table cars add column if not exists original_price bigint;
