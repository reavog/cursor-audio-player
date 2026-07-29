package com.audioplayer.project.model.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OtpVerifyRequest(
    @NotBlank String identifier,
    @NotBlank @Size(min = 6, max = 6) String otp,
    @Size(min = 8, max = 128) String newPassword) {}
