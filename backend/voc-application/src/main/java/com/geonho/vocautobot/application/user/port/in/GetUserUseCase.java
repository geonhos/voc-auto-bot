package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case for retrieving user information
 */
public interface GetUserUseCase {

    User getUserById(Long id);

    Page<User> getAllUsers(Pageable pageable);
}
