package com.audioplayer.project.security;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

public final class RsaKeyLoader {

  private RsaKeyLoader() {}

  public static RSAPrivateKey loadPrivateKey(ResourceLoader resourceLoader, String location)
      throws IOException {
    String pem = readPem(resourceLoader.getResource(location));
    byte[] decoded = decodePem(pem, "PRIVATE KEY");
    try {
      return (RSAPrivateKey)
          KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to load RSA private key from " + location, ex);
    }
  }

  public static RSAPublicKey loadPublicKey(ResourceLoader resourceLoader, String location)
      throws IOException {
    String pem = readPem(resourceLoader.getResource(location));
    byte[] decoded = decodePem(pem, "PUBLIC KEY");
    try {
      return (RSAPublicKey)
          KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(decoded));
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to load RSA public key from " + location, ex);
    }
  }

  private static String readPem(Resource resource) throws IOException {
    if (!resource.exists()) {
      throw new IllegalStateException("RSA key resource not found: " + resource);
    }
    try (InputStream inputStream = resource.getInputStream()) {
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private static byte[] decodePem(String pem, String type) {
    String sanitized =
        pem.replace("-----BEGIN " + type + "-----", "")
            .replace("-----END " + type + "-----", "")
            .replaceAll("\\s", "");
    return Base64.getDecoder().decode(sanitized);
  }
}
