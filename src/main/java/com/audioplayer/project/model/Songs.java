package com.audioplayer.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "songs")
public class Songs {

  protected Songs() {}

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", updatable = false, nullable = false)
  private UUID id;

  @Column(name = "location", nullable = false)
  private String location;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "duration", nullable = false)
  private int duration;

  @Column(name = "album", nullable = false)
  private String album;

  @Column(name = "artist", nullable = false)
  private String artist;

  public Songs(UUID id, String title, String artist, String album, int duration, String location) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.duration = duration;
    this.location = location;
  }

  public UUID getId() {
    return this.id;
  }

  public String getTitle() {
    return this.title;
  }

  public String getLocation() {
    return this.location;
  }

  public int getDuration() {
    return this.duration;
  }

  public String getAlbum() {
    return this.album;
  }

  public String getArtist() {
    return this.artist;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public void setDuration(int duration) {
    this.duration = duration;
  }

  public void setAlbum(String album) {
    this.album = album;
  }
}
