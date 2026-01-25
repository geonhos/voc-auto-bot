package com.geonho.vocautobot.application.auth.port.in.dto;

public record LoginCommand(
        String email,
        String password
) {
}
