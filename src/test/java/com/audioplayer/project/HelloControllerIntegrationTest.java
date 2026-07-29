package com.audioplayer.project;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.client.RestTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
public class HelloControllerIntegrationTest {

  @Autowired private RestTestClient client;

  @Test
  public void getHelloRequiresAuthentication() {
    client.get().uri("/").exchange().expectStatus().isEqualTo(HttpStatus.UNAUTHORIZED);
  }
}
