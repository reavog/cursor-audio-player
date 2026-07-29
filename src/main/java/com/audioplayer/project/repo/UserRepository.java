package com.audioplayer.project.repo;

import com.audioplayer.project.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByUsername(String username);

  Optional<User> findByEmailIgnoreCase(String email);

  boolean existsByUsername(String username);

  boolean existsByEmail(String email);
}
