package com.geonho.vocautobot.domain.user;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class User {

    private Long id;
    private String username;
    private String password;
    private String name;
    private String email;
    private UserRole role;
    private boolean isActive;
    private boolean isLocked;
    private int failedLoginAttempts;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateProfile(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void changeRole(UserRole newRole) {
        this.role = newRole;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void lock() {
        this.isLocked = true;
    }

    public void unlock() {
        this.isLocked = false;
        this.failedLoginAttempts = 0;
    }

    public void recordLoginSuccess() {
        this.failedLoginAttempts = 0;
        this.lastLoginAt = LocalDateTime.now();
    }

    public void recordLoginFailure() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.lock();
        }
    }

    public boolean canLogin() {
        return isActive && !isLocked;
    }
}
