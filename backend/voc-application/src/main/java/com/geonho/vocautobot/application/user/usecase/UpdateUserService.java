package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.UpdateUserUseCase;
import com.geonho.vocautobot.application.user.port.in.UpdateUserUseCase.UpdateUserCommand;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional
public class UpdateUserService implements UpdateUserUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;

    @Override
    public User updateUser(UpdateUserCommand command) {
        User user = loadUserPort.loadById(command.id())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (command.name() != null || command.email() != null) {
            String name = command.name() != null ? command.name() : user.getName();
            String email = command.email() != null ? command.email() : user.getEmail();

            if (command.email() != null && !command.email().equals(user.getEmail())) {
                validateDuplicateEmail(command.email());
            }

            user.updateProfile(name, email);
        }

        if (command.role() != null) {
            user.changeRole(command.role());
        }

        return saveUserPort.save(user);
    }

    private void validateDuplicateEmail(String email) {
        if (loadUserPort.existsByEmail(email)) {
            throw new BusinessException("EMAIL_DUPLICATE", "이미 사용 중인 이메일입니다");
        }
    }
}
