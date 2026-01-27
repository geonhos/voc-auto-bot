package com.geonho.vocautobot.application.user.service;

import com.geonho.vocautobot.application.user.port.in.*;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User service implementing all user-related use cases
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements
        CreateUserUseCase,
        UpdateUserUseCase,
        ChangePasswordUseCase,
        GetUserUseCase,
        ManageUserStatusUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User createUser(CreateUserCommand command) {
        // Validate email uniqueness
        if (loadUserPort.existsByEmail(command.email())) {
            throw new IllegalArgumentException("Email already exists: " + command.email());
        }

        // Create user with encoded password
        User user = User.builder()
                .username(command.username())
                .email(command.email())
                .password(passwordEncoder.encode(command.password()))
                .name(command.name())
                .role(command.role())
                .isActive(true)
                .isLocked(false)
                .failedLoginAttempts(0)
                .build();

        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public User updateUser(UpdateUserCommand command) {
        User user = loadUserPort.loadById(command.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + command.id()));

        // Check email uniqueness if email is being changed
        if (!user.getEmail().equals(command.email()) && loadUserPort.existsByEmail(command.email())) {
            throw new IllegalArgumentException("Email already exists: " + command.email());
        }

        user.updateProfile(command.name(), command.email());
        user.changeRole(command.role());

        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordCommand command) {
        User user = loadUserPort.loadById(command.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + command.userId()));

        // Verify current password
        if (!passwordEncoder.matches(command.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.changePassword(passwordEncoder.encode(command.newPassword()));
        saveUserPort.save(user);
    }

    @Override
    public User getUserById(Long id) {
        return loadUserPort.loadById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        return loadUserPort.loadAll(pageable);
    }

    @Override
    @Transactional
    public User activateUser(Long userId) {
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.activate();
        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public User deactivateUser(Long userId) {
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.deactivate();
        return saveUserPort.save(user);
    }

    /**
     * Interface for password encoding
     * Implementation will be provided by adapter layer
     */
    public interface PasswordEncoder {
        String encode(String rawPassword);
        boolean matches(String rawPassword, String encodedPassword);
    }
}
