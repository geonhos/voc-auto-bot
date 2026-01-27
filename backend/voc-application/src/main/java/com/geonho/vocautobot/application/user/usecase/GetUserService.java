package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.GetUserUseCase;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetUserService implements GetUserUseCase {

    private final LoadUserPort loadUserPort;

    @Override
    public User getUserById(Long userId) {
        return loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        return loadUserPort.loadAll(pageable);
    }
}
