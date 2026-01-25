package com.geonho.vocautobot.application.auth.port.in;

import com.geonho.vocautobot.application.auth.port.in.dto.LoginCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;

public interface LoginUseCase {
    LoginResult login(LoginCommand command);
}
