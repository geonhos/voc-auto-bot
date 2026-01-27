package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;

/**
 * Use case for creating a new user
 */
public interface CreateUserUseCase {

    User createUser(CreateUserCommand command);

    record CreateUserCommand(
            String username,
            String email,
            String password,
            String name,
            UserRole role
    ) {}
}
