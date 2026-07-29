package com.audioplayer.project.model;

import java.util.UUID;

public record UserDTO(UUID id, String username, String email) {}
