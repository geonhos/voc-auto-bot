package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;

/**
 * Use case for updating user information
 */
public interface UpdateUserUseCase {

    User updateUser(UpdateUserCommand command);

    record UpdateUserCommand(
            Long id,
            String name,
            String email,
            UserRole role
    ) {}
}
