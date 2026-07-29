package com.audioplayer.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "playlist_songs",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_playlist_song",
            columnNames = {"playlist_id", "song_id"}))
public class PlaylistSong {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", updatable = false, nullable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "playlist_id", nullable = false)
  private Playlist playlist;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "song_id", nullable = false)
  private Songs song;

  @Column(name = "position", nullable = false)
  private int position;

  @Column(name = "added_at", nullable = false)
  private LocalDateTime addedAt;

  protected PlaylistSong() {}

  public PlaylistSong(Playlist playlist, Songs song, int position) {
    this.playlist = playlist;
    this.song = song;
    this.position = position;
  }

  @PrePersist
  private void onCreate() {
    if (addedAt == null) {
      addedAt = LocalDateTime.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public Playlist getPlaylist() {
    return playlist;
  }

  public Songs getSong() {
    return song;
  }

  public int getPosition() {
    return position;
  }

  public LocalDateTime getAddedAt() {
    return addedAt;
  }
}
