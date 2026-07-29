package com.audioplayer.project.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Mail mail, Otp otp) {

  public record Jwt(String privateKeyLocation, long expiresIn) {}

  public record Mail(String from, String host, int port, String username, String password) {}

  public record Otp(int length, long expiresInSeconds) {}
}
