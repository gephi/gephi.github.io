-- One row per plugin file, client and day (UTC)
CREATE TABLE IF NOT EXISTS downloads (
  file TEXT NOT NULL, -- e.g. 0.11/geolayout-plugin-1.0.0.nbm
  client TEXT NOT NULL, -- gephi (Plugin Manager), browser or other
  day TEXT NOT NULL, -- YYYY-MM-DD
  count INTEGER NOT NULL,
  PRIMARY KEY (file, client, day)
) WITHOUT ROWID;
