package com.audioplayer.project;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.client.RestTestClient;

@AutoConfigureRestTestClient
public class HelloControllerIntegrationTest extends IntegrationTestSupport {

  @Autowired private RestTestClient client;

  @Test
  public void getHelloRequiresAuthentication() {
    client.get().uri("/").exchange().expectStatus().isEqualTo(HttpStatus.UNAUTHORIZED);
  }
}
