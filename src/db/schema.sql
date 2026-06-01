CREATE TABLE IF NOT EXISTS slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_date   TEXT    NOT NULL,
  slot_time   TEXT    NOT NULL,
  status      TEXT    NOT NULL
              CHECK (status IN ('free', 'booked')),
  client_name TEXT,
  UNIQUE (slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS slots_date_status_idx
  ON slots(slot_date, status);

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT    NOT NULL,
  role            TEXT    NOT NULL
                  CHECK (role IN ('user', 'assistant')),
  content         TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS messages_conv_idx
  ON messages(conversation_id, id);
