package com.geonho.vocautobot.domain.voc;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Domain model for VOC status change history.
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id")
public class VocStatusHistory {

    private final Long id;
    private final Long vocId;
    private final VocStatus previousStatus;
    private final VocStatus newStatus;
    private final Long changedBy;
    private final String changeReason;
    private final LocalDateTime createdAt;

    public static VocStatusHistory create(
            Long vocId,
            VocStatus previousStatus,
            VocStatus newStatus,
            Long changedBy,
            String changeReason
    ) {
        return VocStatusHistory.builder()
                .vocId(vocId)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .changeReason(changeReason)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
