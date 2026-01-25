package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.entity.User;
import com.geonho.vocautobot.domain.user.entity.UserRole;

/**
 * Use case for creating a new user
 */
public interface CreateUserUseCase {

    User createUser(CreateUserCommand command);

    record CreateUserCommand(
            String email,
            String password,
            String name,
            UserRole role
    ) {}
}
