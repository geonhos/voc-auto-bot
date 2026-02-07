package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.domain.voc.VocAnalysis;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * VOC 분석 결과 JPA 엔티티
 */
@Entity
@Table(name = "voc_analyses", indexes = {
    @Index(name = "idx_voc_analysis_voc_id", columnList = "voc_id", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VocAnalysisJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voc_id", nullable = false, unique = true)
    private Long vocId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocAnalysis.AnalysisStatus status;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column
    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "possible_causes", columnDefinition = "TEXT")
    private String possibleCauses;

    @Column(name = "related_logs", columnDefinition = "TEXT")
    private String relatedLogs;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public VocAnalysisJpaEntity(Long vocId) {
        this.vocId = vocId;
        this.status = VocAnalysis.AnalysisStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public void startAnalysis() {
        this.status = VocAnalysis.AnalysisStatus.IN_PROGRESS;
    }

    public void completeAnalysis(String summary, Double confidence, String keywords,
                                  String possibleCauses, String relatedLogs, String recommendation) {
        this.status = VocAnalysis.AnalysisStatus.COMPLETED;
        this.summary = summary;
        this.confidence = confidence;
        this.keywords = keywords;
        this.possibleCauses = possibleCauses;
        this.relatedLogs = relatedLogs;
        this.recommendation = recommendation;
        this.analyzedAt = LocalDateTime.now();
    }

    public void failAnalysis(String errorMessage) {
        this.status = VocAnalysis.AnalysisStatus.FAILED;
        this.errorMessage = errorMessage;
        this.analyzedAt = LocalDateTime.now();
    }

    public void resetAnalysis() {
        this.status = VocAnalysis.AnalysisStatus.IN_PROGRESS;
        this.summary = null;
        this.confidence = null;
        this.keywords = null;
        this.possibleCauses = null;
        this.relatedLogs = null;
        this.recommendation = null;
        this.errorMessage = null;
        this.analyzedAt = null;
    }
}
