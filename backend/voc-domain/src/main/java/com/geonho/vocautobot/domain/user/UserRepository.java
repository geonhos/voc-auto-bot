package com.geonho.vocautobot.domain.user;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findAll();

    List<User> findByRole(UserRole role);

    List<User> findByIsActive(boolean isActive);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    void deleteById(Long id);

    long count();
}
