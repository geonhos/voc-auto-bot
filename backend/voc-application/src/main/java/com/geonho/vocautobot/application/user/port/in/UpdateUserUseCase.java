package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.entity.User;
import com.geonho.vocautobot.domain.user.entity.UserRole;

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
