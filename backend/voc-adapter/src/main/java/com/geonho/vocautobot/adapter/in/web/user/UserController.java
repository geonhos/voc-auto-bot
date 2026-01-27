package com.geonho.vocautobot.adapter.in.web.user;

import com.geonho.vocautobot.adapter.in.web.user.dto.*;
import com.geonho.vocautobot.application.user.port.in.*;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * User management REST controller
 */
@Tag(name = "User", description = "사용자 관리 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final CreateUserUseCase createUserUseCase;
    private final UpdateUserUseCase updateUserUseCase;
    private final ChangePasswordUseCase changePasswordUseCase;
    private final GetUserUseCase getUserUseCase;
    private final ManageUserStatusUseCase manageUserStatusUseCase;

    @Operation(summary = "사용자 목록 조회", description = "페이징된 사용자 목록을 조회합니다")
    @GetMapping
    public ApiResponse<UserListResponse> getUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<User> userPage = getUserUseCase.getAllUsers(pageable);
        UserListResponse response = UserListResponse.from(userPage);

        return ApiResponse.success(
                response,
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages()
        );
    }

    @Operation(summary = "사용자 상세 조회", description = "ID로 사용자 정보를 조회합니다")
    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUser(@PathVariable Long id) {
        User user = getUserUseCase.getUserById(id);
        return ApiResponse.success(UserResponse.from(user));
    }

    @Operation(summary = "사용자 생성", description = "새로운 사용자를 생성합니다")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = createUserUseCase.createUser(request.toCommand());
        return ApiResponse.success(UserResponse.from(user));
    }

    @Operation(summary = "사용자 수정", description = "사용자 정보를 수정합니다")
    @PutMapping("/{id}")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        User user = updateUserUseCase.updateUser(request.toCommand(id));
        return ApiResponse.success(UserResponse.from(user));
    }

    @Operation(summary = "비밀번호 변경", description = "사용자의 비밀번호를 변경합니다")
    @PatchMapping("/{id}/password")
    public ApiResponse<Void> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        changePasswordUseCase.changePassword(request.toCommand(id));
        return ApiResponse.success(null);
    }

    @Operation(summary = "사용자 활성화", description = "비활성화된 사용자를 활성화합니다")
    @PatchMapping("/{id}/activate")
    public ApiResponse<UserResponse> activateUser(@PathVariable Long id) {
        User user = manageUserStatusUseCase.activateUser(id);
        return ApiResponse.success(UserResponse.from(user));
    }

    @Operation(summary = "사용자 비활성화", description = "사용자를 비활성화합니다")
    @PatchMapping("/{id}/deactivate")
    public ApiResponse<UserResponse> deactivateUser(@PathVariable Long id) {
        User user = manageUserStatusUseCase.deactivateUser(id);
        return ApiResponse.success(UserResponse.from(user));
    }
}
