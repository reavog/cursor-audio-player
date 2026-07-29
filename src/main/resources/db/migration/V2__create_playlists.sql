-- Playlist schema for user-owned playlists and ordered song membership.
-- Matches Playlist and PlaylistSong entities introduced with the playlists feature.

CREATE TABLE playlists (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_playlists PRIMARY KEY (id),
    CONSTRAINT fk_playlists_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_playlists_user_id ON playlists (user_id);

CREATE TABLE playlist_songs (
    id UUID NOT NULL,
    playlist_id UUID NOT NULL,
    song_id UUID NOT NULL,
    position INTEGER NOT NULL,
    added_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_playlist_songs PRIMARY KEY (id),
    CONSTRAINT uk_playlist_song UNIQUE (playlist_id, song_id),
    CONSTRAINT fk_playlist_songs_playlist FOREIGN KEY (playlist_id)
        REFERENCES playlists (id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_songs_song FOREIGN KEY (song_id) REFERENCES songs (id)
);

CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs (playlist_id);
CREATE INDEX idx_playlist_songs_song_id ON playlist_songs (song_id);
