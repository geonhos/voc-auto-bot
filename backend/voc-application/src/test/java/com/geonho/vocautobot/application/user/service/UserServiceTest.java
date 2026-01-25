package com.geonho.vocautobot.application.user.service;

import com.geonho.vocautobot.application.user.port.in.CreateUserUseCase.CreateUserCommand;
import com.geonho.vocautobot.application.user.port.in.UpdateUserUseCase.UpdateUserCommand;
import com.geonho.vocautobot.application.user.port.in.ChangePasswordUseCase.ChangePasswordCommand;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.entity.User;
import com.geonho.vocautobot.domain.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private LoadUserPort loadUserPort;

    @Mock
    private SaveUserPort saveUserPort;

    @Mock
    private UserService.PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .name("Test User")
                .role(UserRole.AGENT)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("사용자 생성 성공")
    void createUser_shouldSucceed() {
        // given
        CreateUserCommand command = new CreateUserCommand(
                "new@example.com",
                "password123",
                "New User",
                UserRole.AGENT
        );

        when(loadUserPort.existsByEmail(command.email())).thenReturn(false);
        when(passwordEncoder.encode(command.password())).thenReturn("encodedPassword");
        when(saveUserPort.save(any(User.class))).thenReturn(testUser);

        // when
        User result = userService.createUser(command);

        // then
        assertThat(result).isNotNull();
        verify(loadUserPort).existsByEmail(command.email());
        verify(passwordEncoder).encode(command.password());
        verify(saveUserPort).save(any(User.class));
    }

    @Test
    @DisplayName("중복 이메일로 사용자 생성 시 예외 발생")
    void createUser_withDuplicateEmail_shouldThrowException() {
        // given
        CreateUserCommand command = new CreateUserCommand(
                "existing@example.com",
                "password123",
                "New User",
                UserRole.AGENT
        );

        when(loadUserPort.existsByEmail(command.email())).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.createUser(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already exists");

        verify(saveUserPort, never()).save(any(User.class));
    }

    @Test
    @DisplayName("사용자 수정 성공")
    void updateUser_shouldSucceed() {
        // given
        UpdateUserCommand command = new UpdateUserCommand(
                1L,
                "Updated Name",
                "updated@example.com",
                UserRole.MANAGER
        );

        when(loadUserPort.findById(1L)).thenReturn(Optional.of(testUser));
        when(loadUserPort.existsByEmail(command.email())).thenReturn(false);
        when(saveUserPort.save(any(User.class))).thenReturn(testUser);

        // when
        User result = userService.updateUser(command);

        // then
        assertThat(result).isNotNull();
        verify(loadUserPort).findById(1L);
        verify(saveUserPort).save(any(User.class));
    }

    @Test
    @DisplayName("존재하지 않는 사용자 수정 시 예외 발생")
    void updateUser_withNonExistentUser_shouldThrowException() {
        // given
        UpdateUserCommand command = new UpdateUserCommand(
                999L,
                "Updated Name",
                "updated@example.com",
                UserRole.MANAGER
        );

        when(loadUserPort.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.updateUser(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("비밀번호 변경 성공")
    void changePassword_shouldSucceed() {
        // given
        ChangePasswordCommand command = new ChangePasswordCommand(
                1L,
                "currentPassword",
                "newPassword"
        );

        when(loadUserPort.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(command.currentPassword(), testUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode(command.newPassword())).thenReturn("newEncodedPassword");

        // when
        userService.changePassword(command);

        // then
        verify(loadUserPort).findById(1L);
        verify(passwordEncoder).matches(command.currentPassword(), testUser.getPassword());
        verify(passwordEncoder).encode(command.newPassword());
        verify(saveUserPort).save(any(User.class));
    }

    @Test
    @DisplayName("잘못된 현재 비밀번호로 변경 시 예외 발생")
    void changePassword_withWrongCurrentPassword_shouldThrowException() {
        // given
        ChangePasswordCommand command = new ChangePasswordCommand(
                1L,
                "wrongPassword",
                "newPassword"
        );

        when(loadUserPort.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(command.currentPassword(), testUser.getPassword())).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> userService.changePassword(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current password is incorrect");

        verify(saveUserPort, never()).save(any(User.class));
    }

    @Test
    @DisplayName("ID로 사용자 조회 성공")
    void getUserById_shouldSucceed() {
        // given
        when(loadUserPort.findById(1L)).thenReturn(Optional.of(testUser));

        // when
        User result = userService.getUserById(1L);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(loadUserPort).findById(1L);
    }

    @Test
    @DisplayName("존재하지 않는 사용자 조회 시 예외 발생")
    void getUserById_withNonExistentUser_shouldThrowException() {
        // given
        when(loadUserPort.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.getUserById(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("사용자 목록 조회 성공")
    void getAllUsers_shouldSucceed() {
        // given
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);
        when(loadUserPort.findAll(pageable)).thenReturn(userPage);

        // when
        Page<User> result = userService.getAllUsers(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(loadUserPort).findAll(pageable);
    }

    @Test
    @DisplayName("사용자 활성화 성공")
    void activateUser_shouldSucceed() {
        // given
        User inactiveUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .name("Test User")
                .role(UserRole.AGENT)
                .active(false)
                .build();

        when(loadUserPort.findById(1L)).thenReturn(Optional.of(inactiveUser));
        when(saveUserPort.save(any(User.class))).thenReturn(inactiveUser);

        // when
        User result = userService.activateUser(1L);

        // then
        assertThat(result).isNotNull();
        verify(loadUserPort).findById(1L);
        verify(saveUserPort).save(any(User.class));
    }

    @Test
    @DisplayName("사용자 비활성화 성공")
    void deactivateUser_shouldSucceed() {
        // given
        when(loadUserPort.findById(1L)).thenReturn(Optional.of(testUser));
        when(saveUserPort.save(any(User.class))).thenReturn(testUser);

        // when
        User result = userService.deactivateUser(1L);

        // then
        assertThat(result).isNotNull();
        verify(loadUserPort).findById(1L);
        verify(saveUserPort).save(any(User.class));
    }
}
