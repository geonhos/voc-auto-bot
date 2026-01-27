package com.geonho.vocautobot.adapter.out.persistence.user;

import com.geonho.vocautobot.application.auth.port.out.LoadUserPort.AuthUserInfo;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserPersistenceAdapter implements LoadUserPort, SaveUserPort,
        com.geonho.vocautobot.application.auth.port.out.LoadUserPort {

    private final UserJpaRepository userJpaRepository;

    // ======= Auth LoadUserPort =======

    @Override
    public Optional<AuthUserInfo> loadUserByUsername(String usernameOrEmail) {
        // Try to find by email first, then by username
        return userJpaRepository.findByEmail(usernameOrEmail)
                .or(() -> userJpaRepository.findByUsername(usernameOrEmail))
                .map(this::toAuthUserInfo);
    }

    @Override
    public Optional<AuthUserInfo> loadUserById(Long id) {
        return userJpaRepository.findById(id)
                .map(this::toAuthUserInfo);
    }

    private AuthUserInfo toAuthUserInfo(UserJpaEntity entity) {
        return new AuthUserInfo(
                entity.getId(),
                entity.getUsername(),
                entity.getPassword(),
                entity.getName(),
                entity.getEmail(),
                entity.getRole().name(),
                entity.isActive(),
                entity.isLocked()
        );
    }

    // ======= User LoadUserPort =======

    @Override
    public Optional<User> loadById(Long id) {
        return userJpaRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> loadByUsername(String username) {
        return userJpaRepository.findByUsername(username)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> loadByEmail(String email) {
        return userJpaRepository.findByEmail(email)
                .map(this::toDomain);
    }

    @Override
    public List<User> loadAll() {
        return userJpaRepository.findAll()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Page<User> loadAll(Pageable pageable) {
        return userJpaRepository.findAll(pageable)
                .map(this::toDomain);
    }

    @Override
    public List<User> loadByRole(UserRole role) {
        return userJpaRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == role)
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> loadByIsActive(boolean isActive) {
        return userJpaRepository.findAll()
                .stream()
                .filter(u -> u.isActive() == isActive)
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByUsername(String username) {
        return userJpaRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userJpaRepository.existsByEmail(email);
    }

    // ======= SaveUserPort =======

    @Override
    public User save(User user) {
        UserJpaEntity entity;

        if (user.getId() != null) {
            entity = userJpaRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + user.getId()));
            entity.update(user.getName(), user.getEmail(), user.getRole(), user.isActive());
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                entity.updatePassword(user.getPassword());
            }
        } else {
            entity = new UserJpaEntity(
                    user.getUsername(),
                    user.getPassword(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.isActive(),
                    user.isLocked()
            );
        }

        UserJpaEntity saved = userJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        userJpaRepository.deleteById(id);
    }

    // ======= Mapper =======

    private User toDomain(UserJpaEntity entity) {
        return User.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .password(entity.getPassword())
                .name(entity.getName())
                .email(entity.getEmail())
                .role(entity.getRole())
                .isActive(entity.isActive())
                .isLocked(entity.isLocked())
                .failedLoginAttempts(entity.getFailedLoginAttempts())
                .lastLoginAt(entity.getLastLoginAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
