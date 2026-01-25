package com.geonho.vocautobot.adapter.in.security;

import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final LoadUserPort loadUserPort;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        return new SecurityUser(
                user.id(),
                user.username(),
                user.password(),
                user.name(),
                user.isActive(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                !user.isLocked(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role()))
        );
    }

    public UserDetails loadUserById(Long userId) {
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        return new SecurityUser(
                user.id(),
                user.username(),
                user.password(),
                user.name(),
                user.isActive(),
                true,
                true,
                !user.isLocked(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role()))
        );
    }
}
