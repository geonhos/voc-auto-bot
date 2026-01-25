package com.geonho.vocautobot.application.user.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.application.user.port.in.GetUserUseCase;
import com.geonho.vocautobot.application.user.port.in.dto.UserListQuery;
import com.geonho.vocautobot.application.user.port.in.dto.UserResult;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetUserService implements GetUserUseCase {

    private final LoadUserPort loadUserPort;

    @Override
    public UserResult getUserById(Long userId) {
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));
        return UserResult.from(user);
    }

    @Override
    public UserResult getUserByUsername(String username) {
        User user = loadUserPort.loadByUsername(username)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));
        return UserResult.from(user);
    }

    @Override
    public List<UserResult> getUsers(UserListQuery query) {
        List<User> users;

        if (query.role() != null) {
            users = loadUserPort.loadByRole(UserRole.valueOf(query.role()));
        } else if (query.isActive() != null) {
            users = loadUserPort.loadByIsActive(query.isActive());
        } else {
            users = loadUserPort.loadAll();
        }

        return users.stream()
                .filter(user -> matchesSearch(user, query.search()))
                .map(UserResult::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResult> getAllUsers() {
        return loadUserPort.loadAll().stream()
                .map(UserResult::from)
                .collect(Collectors.toList());
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String lowerSearch = search.toLowerCase();
        return user.getUsername().toLowerCase().contains(lowerSearch) ||
                user.getName().toLowerCase().contains(lowerSearch) ||
                user.getEmail().toLowerCase().contains(lowerSearch);
    }
}
