package com.audioplayer.project;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.audioplayer.project.model.auth.LoginRequest;
import com.audioplayer.project.model.auth.LoginResponse;
import com.audioplayer.project.model.auth.RegisterRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.client.RestTestClient;

class AuthControllerIntegrationTest extends IntegrationTestSupport {

  @Autowired private RestTestClient client;

  @Test
  void registeredUserCanLogInAndAccessTheirProfile() {
    String username = "user" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    String email = username + "@example.test";
    String password = "A secure test password";

    client
        .post()
        .uri("/api/auth/register")
        .body(new RegisterRequest(username, email, password))
        .exchange()
        .expectStatus()
        .isEqualTo(HttpStatus.CREATED);

    LoginResponse loginResponse =
        client
            .post()
            .uri("/api/auth/login")
            .body(new LoginRequest(username, password))
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody(LoginResponse.class)
            .returnResult()
            .getResponseBody();

    assertNotNull(loginResponse);
    assertNotNull(loginResponse.accessToken());

    client
        .get()
        .uri("/api/auth/me")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.accessToken())
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.username")
        .isEqualTo(username)
        .jsonPath("$.email")
        .isEqualTo(email);
  }

  @Test
  void profileRequiresAValidToken() {
    client.get().uri("/api/auth/me").exchange().expectStatus().isUnauthorized();

    client
        .get()
        .uri("/api/auth/me")
        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-valid-token")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }
}
