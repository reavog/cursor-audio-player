package com.audioplayer.project.service;

import com.audioplayer.project.config.AppProperties;
import com.audioplayer.project.model.User;
import com.audioplayer.project.security.RsaKeyLoader;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtEncoder jwtEncoder;
  private final long expiresInSeconds;

  public JwtService(
      AppProperties appProperties,
      ResourceLoader resourceLoader,
      @Value("${spring.security.oauth2.resourceserver.jwt.public-key-location}")
          String publicKeyLocation)
      throws Exception {
    this.expiresInSeconds = appProperties.jwt().expiresIn();

    var privateKey =
        RsaKeyLoader.loadPrivateKey(resourceLoader, appProperties.jwt().privateKeyLocation());
    var publicKey = RsaKeyLoader.loadPublicKey(resourceLoader, publicKeyLocation);

    RSAKey rsaKey =
        new RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(UUID.randomUUID().toString())
            .build();

    this.jwtEncoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey)));
  }

  public String createToken(User user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(expiresInSeconds);

    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer("audioplayer")
            .issuedAt(now)
            .expiresAt(expiresAt)
            .subject(user.getUsername())
            .claim("userId", user.getId().toString())
            .claim("email", user.getEmail())
            .build();

    return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }

  public long getExpiresInSeconds() {
    return expiresInSeconds;
  }
}
