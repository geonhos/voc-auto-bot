package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.auth.port.out.PasswordEncoderPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.ChangePasswordUseCase;
import com.geonho.vocautobot.application.user.port.in.dto.ChangePasswordCommand;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional
public class ChangePasswordService implements ChangePasswordUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final PasswordEncoderPort passwordEncoderPort;

    @Override
    public void changePassword(Long userId, ChangePasswordCommand command) {
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (!passwordEncoderPort.matches(command.currentPassword(), user.getPassword())) {
            throw new BusinessException("PASSWORD_MISMATCH", "현재 비밀번호가 일치하지 않습니다");
        }

        String encodedNewPassword = passwordEncoderPort.encode(command.newPassword());
        user.changePassword(encodedNewPassword);

        saveUserPort.save(user);
    }
}
