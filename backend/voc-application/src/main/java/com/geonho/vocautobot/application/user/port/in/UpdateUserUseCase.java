package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.application.user.port.in.dto.UpdateUserCommand;
import com.geonho.vocautobot.application.user.port.in.dto.UserResult;

public interface UpdateUserUseCase {
    UserResult updateUser(Long userId, UpdateUserCommand command);
}
