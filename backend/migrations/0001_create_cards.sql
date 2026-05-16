CREATE TABLE IF NOT EXISTS cards (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    rarity     TEXT NOT NULL CHECK(rarity IN ('SSR', 'SR', 'R', 'N')),
    image_key  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC);
