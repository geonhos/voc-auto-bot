package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.ManageUserStatusUseCase;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.user.port.out.SaveUserPort;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional
public class ManageUserStatusService implements ManageUserStatusUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;

    @Override
    public User activateUser(Long userId) {
        User user = findUser(userId);
        user.activate();
        return saveUserPort.save(user);
    }

    @Override
    public User deactivateUser(Long userId) {
        User user = findUser(userId);
        user.deactivate();
        return saveUserPort.save(user);
    }

    private User findUser(Long userId) {
        return loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));
    }
}
