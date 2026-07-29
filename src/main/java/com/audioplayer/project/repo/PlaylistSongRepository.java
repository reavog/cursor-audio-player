package com.audioplayer.project.repo;

import com.audioplayer.project.model.PlaylistSong;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, UUID> {
  List<PlaylistSong> findByPlaylistIdOrderByPositionAsc(UUID playlistId);

  boolean existsByPlaylistIdAndSongId(UUID playlistId, UUID songId);

  @Query("select coalesce(max(ps.position), -1) from PlaylistSong ps where ps.playlist.id = :playlistId")
  int findMaxPositionByPlaylistId(@Param("playlistId") UUID playlistId);
}
