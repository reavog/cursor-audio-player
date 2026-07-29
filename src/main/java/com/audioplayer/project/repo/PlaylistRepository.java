package com.audioplayer.project.repo;

import com.audioplayer.project.model.Playlist;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<Playlist, UUID> {
  long countByUserId(UUID userId);

  List<Playlist> findByUserIdOrderByCreatedAtDesc(UUID userId);

  Optional<Playlist> findByIdAndUserId(UUID id, UUID userId);
}
