package com.audioplayer.project.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PlaylistDTO(
    UUID id,
    String name,
    String creatorUsername,
    LocalDateTime createdAt,
    int songCount,
    int totalDurationSeconds,
    List<SongsDTO> songs) {}
