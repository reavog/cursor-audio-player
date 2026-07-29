package com.audioplayer.project.model.auth;

public record LoginResponse(String accessToken, String tokenType, long expiresIn) {}
