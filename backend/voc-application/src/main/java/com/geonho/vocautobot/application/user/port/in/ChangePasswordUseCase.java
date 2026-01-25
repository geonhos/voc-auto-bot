package com.geonho.vocautobot.application.user.port.in;

/**
 * Use case for changing user password
 */
public interface ChangePasswordUseCase {

    void changePassword(ChangePasswordCommand command);

    record ChangePasswordCommand(
            Long userId,
            String currentPassword,
            String newPassword
    ) {}
}
