package com.geonho.vocautobot.application.user.port.out;

import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface LoadUserPort {

    Optional<User> loadById(Long id);

    Optional<User> loadByUsername(String username);

    Optional<User> loadByEmail(String email);

    List<User> loadAll();

    Page<User> loadAll(Pageable pageable);

    List<User> loadByRole(UserRole role);

    List<User> loadByIsActive(boolean isActive);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
