package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.application.user.port.in.dto.ChangePasswordCommand;

public interface ChangePasswordUseCase {
    void changePassword(Long userId, ChangePasswordCommand command);
}
