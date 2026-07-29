package com.audioplayer.project.service;

import com.audioplayer.project.config.AppProperties;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

  private static final char[] OTP_ALPHABET =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

  private final AppProperties appProperties;
  private final PasswordEncoder passwordEncoder;
  private final SecureRandom secureRandom = new SecureRandom();
  private final Map<UUID, StoredOtp> otpsByUserId = new ConcurrentHashMap<>();

  public OtpService(AppProperties appProperties, PasswordEncoder passwordEncoder) {
    this.appProperties = appProperties;
    this.passwordEncoder = passwordEncoder;
  }

  public String issueOtp(UUID userId) {
    String code = generateCode(appProperties.otp().length());
    Instant expiresAt = Instant.now().plusSeconds(appProperties.otp().expiresInSeconds());
    otpsByUserId.put(userId, new StoredOtp(passwordEncoder.encode(code), expiresAt));
    return code;
  }

  public boolean verifyAndConsume(UUID userId, String code) {
    StoredOtp stored = otpsByUserId.get(userId);
    if (stored == null) {
      return false;
    }
    if (Instant.now().isAfter(stored.expiresAt())) {
      otpsByUserId.remove(userId);
      return false;
    }
    boolean matches = passwordEncoder.matches(code.toUpperCase(), stored.codeHash());
    if (matches) {
      otpsByUserId.remove(userId);
    }
    return matches;
  }

  private String generateCode(int length) {
    StringBuilder builder = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      builder.append(OTP_ALPHABET[secureRandom.nextInt(OTP_ALPHABET.length)]);
    }
    return builder.toString();
  }

  private record StoredOtp(String codeHash, Instant expiresAt) {}
}
