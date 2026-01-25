package com.geonho.vocautobot.application.user.service;

import com.geonho.vocautobot.application.user.port.in.*;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.entity.User;
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
                .email(command.email())
                .password(passwordEncoder.encode(command.password()))
                .name(command.name())
                .role(command.role())
                .active(true)
                .build();

        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public User updateUser(UpdateUserCommand command) {
        User user = loadUserPort.findById(command.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + command.id()));

        // Check email uniqueness if email is being changed
        if (!user.getEmail().equals(command.email()) && loadUserPort.existsByEmail(command.email())) {
            throw new IllegalArgumentException("Email already exists: " + command.email());
        }

        user.updateInfo(command.name(), command.email());
        user.updateRole(command.role());

        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordCommand command) {
        User user = loadUserPort.findById(command.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + command.userId()));

        // Verify current password
        if (!passwordEncoder.matches(command.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.updatePassword(passwordEncoder.encode(command.newPassword()));
        saveUserPort.save(user);
    }

    @Override
    public User getUserById(Long id) {
        return loadUserPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        return loadUserPort.findAll(pageable);
    }

    @Override
    @Transactional
    public User activateUser(Long userId) {
        User user = loadUserPort.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.activate();
        return saveUserPort.save(user);
    }

    @Override
    @Transactional
    public User deactivateUser(Long userId) {
        User user = loadUserPort.findById(userId)
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
