package com.audioplayer.project.repo;

import com.audioplayer.project.model.Songs;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

// JPA automatically gives CRUD operations
public interface SongsRepository extends JpaRepository<Songs, UUID> {}
