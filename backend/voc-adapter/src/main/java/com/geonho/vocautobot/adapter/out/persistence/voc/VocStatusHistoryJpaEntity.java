package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.domain.voc.VocStatus;
import com.geonho.vocautobot.domain.voc.VocStatusHistory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "voc_status_history", indexes = {
    @Index(name = "idx_vsh_voc_id", columnList = "voc_id"),
    @Index(name = "idx_vsh_created", columnList = "created_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VocStatusHistoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voc_id", nullable = false)
    private VocJpaEntity voc;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false, length = 20)
    private VocStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private VocStatus newStatus;

    @Column(name = "changed_by")
    private Long changedBy;

    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public VocStatusHistory toDomain() {
        return VocStatusHistory.builder()
                .id(this.id)
                .vocId(this.voc.getId())
                .previousStatus(this.previousStatus)
                .newStatus(this.newStatus)
                .changedBy(this.changedBy)
                .changeReason(this.changeReason)
                .createdAt(this.createdAt)
                .build();
    }

    public static VocStatusHistoryJpaEntity fromDomain(VocStatusHistory domain, VocJpaEntity vocEntity) {
        VocStatusHistoryJpaEntity entity = new VocStatusHistoryJpaEntity();
        entity.voc = vocEntity;
        entity.previousStatus = domain.getPreviousStatus();
        entity.newStatus = domain.getNewStatus();
        entity.changedBy = domain.getChangedBy();
        entity.changeReason = domain.getChangeReason();
        entity.createdAt = domain.getCreatedAt();
        return entity;
    }
}
