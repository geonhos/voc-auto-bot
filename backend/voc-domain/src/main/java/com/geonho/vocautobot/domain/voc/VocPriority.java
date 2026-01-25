package com.geonho.vocautobot.domain.voc;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VocPriority {
    URGENT("긴급", 1, "즉시 처리가 필요한 VOC"),
    HIGH("높음", 2, "우선 처리가 필요한 VOC"),
    NORMAL("보통", 3, "일반적인 VOC"),
    LOW("낮음", 4, "낮은 우선순위의 VOC");

    private final String displayName;
    private final int level;
    private final String description;
}
