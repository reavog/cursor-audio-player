CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  album VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_songs_search_trgm
  ON songs
  USING GIN (
    (
      LOWER(
        COALESCE(title, '') || ' ' ||
        COALESCE(artist, '') || ' ' ||
        COALESCE(album, '')
      )
    ) gin_trgm_ops
  );
