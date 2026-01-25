package com.geonho.vocautobot.adapter.out.security;

import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class TokenAdapter implements TokenPort {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    private static final String REFRESH_TOKEN_PREFIX = "refresh:";
    private static final long REFRESH_TOKEN_EXPIRY_HOURS = 168; // 7 days

    @Override
    public String createAccessToken(Long userId, String username, String role) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                username,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        return jwtTokenProvider.createAccessToken(authentication, userId);
    }

    @Override
    public String createRefreshToken(String username) {
        return jwtTokenProvider.createRefreshToken(username);
    }

    @Override
    public void saveRefreshToken(String username, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + username;
        redisTemplate.opsForValue().set(key, refreshToken, REFRESH_TOKEN_EXPIRY_HOURS, TimeUnit.HOURS);
    }

    @Override
    public Optional<String> getRefreshToken(String username) {
        String key = REFRESH_TOKEN_PREFIX + username;
        String token = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(token);
    }

    @Override
    public void deleteRefreshToken(String username) {
        String key = REFRESH_TOKEN_PREFIX + username;
        redisTemplate.delete(key);
    }

    @Override
    public boolean validateRefreshToken(String refreshToken) {
        return jwtTokenProvider.validateToken(refreshToken);
    }

    @Override
    public String getUsernameFromRefreshToken(String refreshToken) {
        return jwtTokenProvider.getUsername(refreshToken);
    }
}
