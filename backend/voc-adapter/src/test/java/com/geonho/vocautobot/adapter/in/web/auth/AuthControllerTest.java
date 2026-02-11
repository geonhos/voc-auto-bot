package com.geonho.vocautobot.adapter.in.web.auth;

import com.geonho.vocautobot.adapter.common.exception.GlobalExceptionHandler;
import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import com.geonho.vocautobot.application.auth.port.in.LoginUseCase;
import com.geonho.vocautobot.application.auth.port.in.LogoutUseCase;
import com.geonho.vocautobot.application.auth.port.in.RefreshTokenUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {"security.enabled=false"})
@DisplayName("AuthController 통합 테스트")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LoginUseCase loginUseCase;

    @MockBean
    private LogoutUseCase logoutUseCase;

    @MockBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Nested
    @DisplayName("POST /v1/auth/login - 로그인")
    class Login {

        @Test
        @DisplayName("로그인 성공")
        void shouldLoginSuccessfully() throws Exception {
            LoginResult result = new LoginResult(
                    "access-token-123",
                    "refresh-token-456",
                    1L,
                    "admin@example.com",
                    "관리자",
                    "ADMIN"
            );
            given(loginUseCase.login(any())).willReturn(result);

            String requestBody = """
                    {
                        "email": "admin@example.com",
                        "password": "password123"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("access-token-123"))
                    .andExpect(jsonPath("$.data.refreshToken").value("refresh-token-456"))
                    .andExpect(jsonPath("$.data.user.email").value("admin@example.com"))
                    .andExpect(jsonPath("$.data.user.role").value("ADMIN"));
        }

        @Test
        @DisplayName("잘못된 자격 증명으로 로그인 실패")
        void shouldFailWithBadCredentials() throws Exception {
            given(loginUseCase.login(any()))
                    .willThrow(new BadCredentialsException("Invalid credentials"));

            String requestBody = """
                    {
                        "email": "admin@example.com",
                        "password": "wrong-password"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("이메일 누락 시 400 에러")
        void shouldReturn400WhenEmailMissing() throws Exception {
            String requestBody = """
                    {
                        "password": "password123"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("비밀번호 누락 시 400 에러")
        void shouldReturn400WhenPasswordMissing() throws Exception {
            String requestBody = """
                    {
                        "email": "admin@example.com"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("잘못된 이메일 형식으로 400 에러")
        void shouldReturn400WhenInvalidEmailFormat() throws Exception {
            String requestBody = """
                    {
                        "email": "not-an-email",
                        "password": "password123"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("POST /v1/auth/logout - 로그아웃")
    class Logout {

        @Test
        @DisplayName("로그아웃 성공")
        void shouldLogoutSuccessfully() throws Exception {
            doNothing().when(logoutUseCase).logout(anyString());

            mockMvc.perform(post("/v1/auth/logout")
                            .header("Authorization", "Bearer some-access-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Authorization 헤더 없이도 로그아웃 성공")
        void shouldLogoutWithoutAuthHeader() throws Exception {
            mockMvc.perform(post("/v1/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("POST /v1/auth/refresh - 토큰 갱신")
    class RefreshToken {

        @Test
        @DisplayName("토큰 갱신 성공")
        void shouldRefreshTokenSuccessfully() throws Exception {
            TokenResult result = new TokenResult("new-access-token", "new-refresh-token");
            given(refreshTokenUseCase.refresh(anyString())).willReturn(result);

            String requestBody = """
                    {
                        "refreshToken": "old-refresh-token"
                    }
                    """;

            mockMvc.perform(post("/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"));
        }

        @Test
        @DisplayName("리프레시 토큰 누락 시 400 에러")
        void shouldReturn400WhenRefreshTokenMissing() throws Exception {
            String requestBody = "{}";

            mockMvc.perform(post("/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
