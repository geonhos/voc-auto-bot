package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.domain.user.User;

/**
 * Use case for managing user activation status
 */
public interface ManageUserStatusUseCase {

    User activateUser(Long userId);

    User deactivateUser(Long userId);
}
