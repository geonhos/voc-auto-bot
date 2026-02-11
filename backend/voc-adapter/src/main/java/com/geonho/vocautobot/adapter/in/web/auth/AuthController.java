package com.geonho.vocautobot.adapter.in.web.auth;

import com.geonho.vocautobot.adapter.in.web.auth.dto.*;
import com.geonho.vocautobot.adapter.out.security.JwtTokenProvider;
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
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
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
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인합니다")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = resolveClientIp(httpRequest);
        LoginCommand command = new LoginCommand(request.email(), request.password(), clientIp);
        LoginResult result = loginUseCase.login(command);

        ResponseCookie accessCookie = jwtTokenProvider.generateAccessTokenCookie(result.accessToken());
        ResponseCookie refreshCookie = jwtTokenProvider.generateRefreshTokenCookie(result.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(LoginResponse.from(result)));
    }

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
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest) {
        // Try to extract token from header or cookie for server-side cleanup
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            token = resolveTokenFromCookie(httpRequest);
        }

        if (token != null) {
            logoutUseCase.logout(token);
        }

        ResponseCookie clearAccess = jwtTokenProvider.generateClearAccessTokenCookie();
        ResponseCookie clearRefresh = jwtTokenProvider.generateClearRefreshTokenCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccess.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefresh.toString())
                .body(ApiResponse.success(null));
    }

    @Operation(summary = "토큰 갱신", description = "리프레시 토큰으로 액세스 토큰을 갱신합니다")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refreshToken(HttpServletRequest httpRequest) {
        String refreshToken = resolveRefreshTokenFromCookie(httpRequest);
        if (refreshToken == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH_001", "리프레시 토큰이 없습니다"));
        }

        TokenResult result = refreshTokenUseCase.refresh(refreshToken);

        ResponseCookie accessCookie = jwtTokenProvider.generateAccessTokenCookie(result.accessToken());
        ResponseCookie refreshCookie = jwtTokenProvider.generateRefreshTokenCookie(result.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(null));
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

    private String resolveTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JwtTokenProvider.ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String resolveRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JwtTokenProvider.REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
