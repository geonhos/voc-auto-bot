package com.geonho.vocautobot.adapter.in.web.auth;

import com.geonho.vocautobot.adapter.in.web.auth.dto.*;
import com.geonho.vocautobot.application.auth.port.in.LoginUseCase;
import com.geonho.vocautobot.application.auth.port.in.LogoutUseCase;
import com.geonho.vocautobot.application.auth.port.in.RefreshTokenUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenResult;
import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.security.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증", description = "인증 관련 API")
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final LogoutUseCase logoutUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인합니다")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = resolveClientIp(httpRequest);
        LoginCommand command = new LoginCommand(request.email(), request.password(), clientIp);
        LoginResult result = loginUseCase.login(command);
        return ApiResponse.success(LoginResponse.from(result));
    }

    /**
     * Resolves the client IP address from the request.
     * Checks X-Forwarded-For and X-Real-IP headers for proxy scenarios.
     *
     * @param request the HTTP request
     * @return client IP address
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    @Operation(summary = "로그아웃", description = "현재 세션에서 로그아웃합니다")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            logoutUseCase.logout(token);
        }
        return ApiResponse.success(null);
    }

    @Operation(summary = "토큰 갱신", description = "리프레시 토큰으로 액세스 토큰을 갱신합니다")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResult result = refreshTokenUseCase.refresh(request.refreshToken());
        return ApiResponse.success(TokenResponse.from(result));
    }

    @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자 정보를 조회합니다")
    @GetMapping("/me")
    public ApiResponse<UserInfoResponse> me(@AuthenticationPrincipal SecurityUser securityUser) {
        return ApiResponse.success(new UserInfoResponse(
                securityUser.getUserId(),
                securityUser.getUsername(),
                securityUser.getDisplayName(),
                securityUser.getAuthorities().iterator().next().getAuthority()
        ));
    }
}
