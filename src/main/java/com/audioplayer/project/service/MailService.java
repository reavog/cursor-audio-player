package com.audioplayer.project.service;

import com.audioplayer.project.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MailService {

  private static final Logger log = LoggerFactory.getLogger(MailService.class);

  private final AppProperties appProperties;

  public MailService(AppProperties appProperties) {
    this.appProperties = appProperties;
  }

  public void sendOtp(String toEmail, String otp) {
    String from = appProperties.mail().from();

    // Local development delivery: always print the OTP so login works without SMTP.
    System.out.println("========================================");
    System.out.println("OTP EMAIL (dev console delivery)");
    System.out.println("From: " + from);
    System.out.println("To:   " + toEmail);
    System.out.println("OTP:  " + otp);
    System.out.println("========================================");

    log.info("OTP issued for {} (from {}). Console delivery used; SMTP not configured.", toEmail, from);

    if (appProperties.mail().host() != null && !appProperties.mail().host().isBlank()) {
      // Reserved for a future SMTP integration using MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD.
      log.info(
          "MAIL_HOST is set ({}), but SMTP sending is not implemented yet. OTP was printed to the console.",
          appProperties.mail().host());
    }
  }
}
