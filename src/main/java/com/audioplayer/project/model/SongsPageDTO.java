package com.audioplayer.project.model;

import java.util.List;

public record SongsPageDTO(
    List<SongsDTO> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last) {}
