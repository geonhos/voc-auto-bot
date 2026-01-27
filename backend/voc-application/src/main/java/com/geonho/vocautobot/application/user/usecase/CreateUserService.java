package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.auth.port.out.PasswordEncoderPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.CreateUserUseCase;
import com.geonho.vocautobot.application.user.port.in.CreateUserUseCase.CreateUserCommand;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional
public class CreateUserService implements CreateUserUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final PasswordEncoderPort passwordEncoderPort;

    @Override
    public User createUser(CreateUserCommand command) {
        validateDuplicateUsername(command.username());
        validateDuplicateEmail(command.email());

        User user = User.builder()
                .username(command.username())
                .password(passwordEncoderPort.encode(command.password()))
                .name(command.name())
                .email(command.email())
                .role(command.role())
                .isActive(true)
                .isLocked(false)
                .failedLoginAttempts(0)
                .build();

        return saveUserPort.save(user);
    }

    private void validateDuplicateUsername(String username) {
        if (loadUserPort.existsByUsername(username)) {
            throw new BusinessException("USERNAME_DUPLICATE", "이미 사용 중인 아이디입니다");
        }
    }

    private void validateDuplicateEmail(String email) {
        if (loadUserPort.existsByEmail(email)) {
            throw new BusinessException("EMAIL_DUPLICATE", "이미 사용 중인 이메일입니다");
        }
    }
}
