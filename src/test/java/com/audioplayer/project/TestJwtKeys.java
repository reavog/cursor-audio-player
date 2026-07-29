package com.audioplayer.project;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

final class TestJwtKeys {

  private final Path privateKey;
  private final Path publicKey;

  private TestJwtKeys(Path privateKey, Path publicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  static TestJwtKeys create() {
    try {
      KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
      keyPairGenerator.initialize(2048);
      KeyPair keyPair = keyPairGenerator.generateKeyPair();

      Path directory = Files.createTempDirectory("audioplayer-test-jwt-");
      Path privateKey = directory.resolve("private.pem");
      Path publicKey = directory.resolve("public.pem");
      Files.writeString(privateKey, toPem("PRIVATE KEY", keyPair.getPrivate().getEncoded()));
      Files.writeString(publicKey, toPem("PUBLIC KEY", keyPair.getPublic().getEncoded()));
      privateKey.toFile().deleteOnExit();
      publicKey.toFile().deleteOnExit();
      directory.toFile().deleteOnExit();

      return new TestJwtKeys(privateKey, publicKey);
    } catch (IOException | GeneralSecurityException exception) {
      throw new IllegalStateException("Unable to create test JWT keys", exception);
    }
  }

  String privateKeyLocation() {
    return privateKey.toUri().toString();
  }

  String publicKeyLocation() {
    return publicKey.toUri().toString();
  }

  private static String toPem(String type, byte[] encoded) {
    String base64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII)).encodeToString(encoded);
    return "-----BEGIN " + type + "-----\n" + base64 + "\n-----END " + type + "-----\n";
  }
}
