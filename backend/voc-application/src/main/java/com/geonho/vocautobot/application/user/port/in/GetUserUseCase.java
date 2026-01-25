package com.geonho.vocautobot.application.user.port.in;

import com.geonho.vocautobot.application.user.port.in.dto.UserListQuery;
import com.geonho.vocautobot.application.user.port.in.dto.UserResult;

import java.util.List;

public interface GetUserUseCase {

    UserResult getUserById(Long userId);

    UserResult getUserByUsername(String username);

    List<UserResult> getUsers(UserListQuery query);

    List<UserResult> getAllUsers();
}
