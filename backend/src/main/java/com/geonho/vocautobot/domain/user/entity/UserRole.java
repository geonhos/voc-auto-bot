package com.geonho.vocautobot.domain.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
    ADMIN("관리자"),
    MANAGER("매니저"),
    AGENT("상담원");

    private final String displayName;
}
