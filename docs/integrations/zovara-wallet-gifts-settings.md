# ZOVARA-inspired Creator Hub Live convergence

This integration keeps Creator Hub Live as the product and repository of record. It selectively adopts the ZOVARA economy and presentation rules rather than importing a second application stack.

## Wallet and economy boundaries

- CHL's existing wallet page and backend remain authoritative for balances, recharge packages, PayPal checkout, diamond conversion, payouts, and ledger history.
- Gift sending remains a server-authoritative CHL operation. A client animation never creates or retries a financial transaction.
- Coin top-ups do not grant gifter progression. Only settled, eligible gift spend counts.
- Gift reversals, refunds, fraud events, and chargebacks must reverse eligible spend through the financial event path; never edit historical ledger rows.

## Gifter progression adopted from ZOVARA

- 50 lifetime levels grouped into Spark (1–10), Bronze (11–20), Silver (21–30), Gold (31–40), and Cosmic (41–50).
- Level 0 is Newcomer.
- Level 50 begins at exactly 100,000,000 eligible gift coins spent.
- Monthly leaderboards remain period-based and separate from lifetime gifter levels.
- The catalog is the single threshold/name source. Backend code validates strict monotonicity and rejects unsafe or negative spend values.

## Gifts and visual direction

CHL's existing Jamaica/parish-pride gift catalogue and its separate artwork/animation assets remain the active gift system. The ZOVARA catalog is not copied over it because that would create competing gift IDs, prices, and asset paths. New gift designs should be added to the CHL catalogue once, with artwork and animation references validated by the existing gift asset contract. Reduced-motion fallbacks remain mandatory.

## Settings convergence

CHL's existing persistent settings routes remain canonical: profile, security, privacy, blocked accounts, notifications, payments, LIVE, and appearance. Preserve the settings save contract and the appearance preference merge so changing one category cannot overwrite another. Do not introduce a parallel ZOVARA settings store.

## Deliberately not copied

- ZOVARA-specific API, database schema, provider integrations, payment adapter, branding, or deployment assumptions.
- Duplicate wallet routes, gift catalogs, payment ledgers, or user-settings tables.
- Any demo balances, seeded transactions, fake creator earnings, or placeholder payment success.

This document describes integration boundaries; it does not claim that a production database migration or live provider configuration has been applied.
