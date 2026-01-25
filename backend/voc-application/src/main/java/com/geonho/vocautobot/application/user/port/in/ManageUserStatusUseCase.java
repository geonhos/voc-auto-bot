package com.geonho.vocautobot.application.user.port.in;

public interface ManageUserStatusUseCase {

    void activateUser(Long userId);

    void deactivateUser(Long userId);

    void lockUser(Long userId);

    void unlockUser(Long userId);
}
