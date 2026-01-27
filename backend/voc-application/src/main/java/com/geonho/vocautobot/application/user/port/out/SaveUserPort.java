package com.geonho.vocautobot.application.user.port.out;

import com.geonho.vocautobot.domain.user.User;

public interface SaveUserPort {

    User save(User user);

    void deleteById(Long id);
}
