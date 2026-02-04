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

    /**
     * 현재 상태에서 새로운 상태로 전이 가능한지 확인합니다.
     *
     * 상태 전이 규칙:
     * - NEW(접수) → IN_PROGRESS(처리중), RESOLVED(완료), REJECTED(반려)
     * - IN_PROGRESS(처리중) → RESOLVED(완료), REJECTED(반려)
     * - PENDING(보류) → RESOLVED(완료), REJECTED(반려) [레거시 호환]
     * - RESOLVED(완료) → 변경 불가
     * - CLOSED(종료) → 변경 불가
     * - REJECTED(반려) → 변경 불가
     */
    public boolean canTransitionTo(VocStatus newStatus) {
        return switch (this) {
            case NEW -> newStatus == IN_PROGRESS || newStatus == RESOLVED || newStatus == REJECTED;
            case IN_PROGRESS -> newStatus == RESOLVED || newStatus == REJECTED;
            case PENDING -> newStatus == RESOLVED || newStatus == REJECTED;
            case RESOLVED, CLOSED, REJECTED -> false;
        };
    }

    /**
     * 최종 상태(Terminal State)인지 확인합니다.
     * 최종 상태는 다른 상태로 전이할 수 없습니다.
     */
    public boolean isTerminal() {
        return this == RESOLVED || this == REJECTED || this == CLOSED;
    }
}
