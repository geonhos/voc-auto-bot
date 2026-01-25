package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.application.user.port.in.dto.CreateUserCommand;
import com.geonho.vocautobot.application.user.port.in.dto.UserResult;

public interface CreateUserUseCase {
    UserResult createUser(CreateUserCommand command);
}
