package com.audioplayer.project.model;

import java.util.UUID;

public record SongsDTO(UUID id, String title, String artist, String album, int duration) {}
