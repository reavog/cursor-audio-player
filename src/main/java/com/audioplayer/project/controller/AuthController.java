package com.audioplayer.project.controller;

import com.audioplayer.project.model.UserDTO;
import com.audioplayer.project.model.auth.ForgotPasswordRequest;
import com.audioplayer.project.model.auth.LoginRequest;
import com.audioplayer.project.model.auth.LoginResponse;
import com.audioplayer.project.model.auth.MessageResponse;
import com.audioplayer.project.model.auth.OtpVerifyRequest;
import com.audioplayer.project.model.auth.RegisterRequest;
import com.audioplayer.project.service.AuthService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
    authService.register(request);
    return new MessageResponse("Account created");
  }

  @PostMapping("/forgot-password")
  public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return authService.forgotPassword(request);
  }

  @PostMapping("/otp/verify")
  public LoginResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
    return authService.verifyOtp(request);
  }

  @GetMapping("/me")
  public UserDTO currentUser(Principal principal) {
    return authService.currentUser(principal.getName());
  }
}
