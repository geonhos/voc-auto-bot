package com.geonho.vocautobot.adapter.in.web.auth.dto;

public record UserInfoResponse(
        Long id,
        String email,
        String name,
        String role
) {
}
