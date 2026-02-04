package com.geonho.vocautobot.adapter.out.persistence.user;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import com.geonho.vocautobot.domain.user.UserRole;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username", unique = true),
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public UserJpaEntity(String username, String password, String name, String email,
                         UserRole role, boolean isActive, boolean isLocked) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
        this.isLocked = isLocked;
        this.failedLoginAttempts = 0;
    }

    public void update(String name, String email, UserRole role, boolean isActive) {
        if (name != null) {
            this.name = name;
        }
        if (email != null) {
            this.email = email;
        }
        if (role != null) {
            this.role = role;
        }
        this.isActive = isActive;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void recordLoginSuccess() {
        this.failedLoginAttempts = 0;
        this.lastLoginAt = LocalDateTime.now();
    }

    public void recordLoginFailure() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.isLocked = true;
        }
    }

    public void unlock() {
        this.isLocked = false;
        this.failedLoginAttempts = 0;
    }

    /**
     * 도메인 객체로부터 로그인 상태 관련 필드를 업데이트합니다.
     *
     * @param failedLoginAttempts 실패한 로그인 시도 횟수
     * @param isLocked 계정 잠금 여부
     * @param lastLoginAt 마지막 로그인 시간
     */
    public void updateLoginStatus(int failedLoginAttempts, boolean isLocked, LocalDateTime lastLoginAt) {
        this.failedLoginAttempts = failedLoginAttempts;
        this.isLocked = isLocked;
        this.lastLoginAt = lastLoginAt;
    }
}
