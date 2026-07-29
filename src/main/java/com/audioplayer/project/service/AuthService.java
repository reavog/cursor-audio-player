package com.audioplayer.project.service;

import com.audioplayer.project.model.User;
import com.audioplayer.project.model.UserDTO;
import com.audioplayer.project.model.auth.ForgotPasswordRequest;
import com.audioplayer.project.model.auth.LoginRequest;
import com.audioplayer.project.model.auth.LoginResponse;
import com.audioplayer.project.model.auth.MessageResponse;
import com.audioplayer.project.model.auth.OtpVerifyRequest;
import com.audioplayer.project.model.auth.RegisterRequest;
import com.audioplayer.project.repo.UserRepository;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final OtpService otpService;
  private final MailService mailService;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      OtpService otpService,
      MailService mailService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.otpService = otpService;
    this.mailService = mailService;
  }

  @Transactional
  public void register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase();

    if (userRepository.existsByUsername(request.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
    }
    if (userRepository.existsByEmail(email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
    }

    User user = new User();
    user.setUsername(request.username());
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userRepository.save(user);
  }

  @Transactional(readOnly = true)
  public LoginResponse login(LoginRequest request) {
    User user =
        findByIdentifier(request.identifier())
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid username/email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "Invalid username/email or password");
    }

    return issueLoginResponse(user);
  }

  @Transactional(readOnly = true)
  public MessageResponse forgotPassword(ForgotPasswordRequest request) {
    Optional<User> user = findByIdentifier(request.identifier());
    user.ifPresent(
        account -> {
          String otp = otpService.issueOtp(account.getId());
          mailService.sendOtp(account.getEmail(), otp);
        });

    return new MessageResponse(
        "If an account exists for that username or email, a sign-in code has been sent.");
  }

  @Transactional
  public LoginResponse verifyOtp(OtpVerifyRequest request) {
    User user =
        findByIdentifier(request.identifier())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code"));

    if (!otpService.verifyAndConsume(user.getId(), request.otp().trim())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code");
    }

    if (request.newPassword() != null && !request.newPassword().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
      userRepository.save(user);
    }

    return issueLoginResponse(user);
  }

  @Transactional(readOnly = true)
  public UserDTO currentUser(String username) {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return new UserDTO(user.getId(), user.getUsername(), user.getEmail());
  }

  private Optional<User> findByIdentifier(String identifier) {
    String trimmed = identifier.trim();
    if (trimmed.contains("@")) {
      return userRepository.findByEmailIgnoreCase(trimmed);
    }
    return userRepository
        .findByUsername(trimmed)
        .or(() -> userRepository.findByEmailIgnoreCase(trimmed));
  }

  private LoginResponse issueLoginResponse(User user) {
    return new LoginResponse(
        jwtService.createToken(user), "Bearer", jwtService.getExpiresInSeconds());
  }
}
