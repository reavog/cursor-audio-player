package com.audioplayer.project.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenamePlaylistRequest(
    @NotBlank @Size(max = 120) String name) {}
