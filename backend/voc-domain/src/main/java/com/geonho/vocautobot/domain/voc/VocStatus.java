package com.geonho.vocautobot.domain.voc;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VocStatus {
    NEW("신규", "접수된 신규 VOC"),
    IN_PROGRESS("처리중", "처리 진행 중인 VOC"),
    PENDING("보류", "일시적으로 보류된 VOC"),
    RESOLVED("해결완료", "해결이 완료된 VOC"),
    CLOSED("종료", "최종 종료된 VOC"),
    REJECTED("반려", "반려된 VOC");

    private final String displayName;
    private final String description;

    public boolean canTransitionTo(VocStatus newStatus) {
        return switch (this) {
            case NEW -> newStatus == IN_PROGRESS || newStatus == REJECTED;
            case IN_PROGRESS -> newStatus == PENDING || newStatus == RESOLVED || newStatus == REJECTED;
            case PENDING -> newStatus == IN_PROGRESS || newStatus == REJECTED;
            case RESOLVED -> newStatus == CLOSED || newStatus == IN_PROGRESS;
            case CLOSED -> false;
            case REJECTED -> newStatus == IN_PROGRESS;
        };
    }
}
