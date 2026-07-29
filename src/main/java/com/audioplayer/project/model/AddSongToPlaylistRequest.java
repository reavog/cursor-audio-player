package com.audioplayer.project.model;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddSongToPlaylistRequest(@NotNull UUID songId) {}
