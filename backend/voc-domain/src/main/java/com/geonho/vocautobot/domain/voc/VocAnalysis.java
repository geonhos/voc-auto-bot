package com.geonho.vocautobot.domain.voc;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * VOC AI 분석 결과 엔티티
 * VOC 생성 후 비동기로 분석되어 저장됨
 */
@Entity
@Table(name = "voc_analyses", indexes = {
    @Index(name = "idx_voc_analysis_voc_id", columnList = "voc_id", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class VocAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voc_id", nullable = false, unique = true)
    private Long vocId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AnalysisStatus status = AnalysisStatus.PENDING;

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
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AnalysisStatus {
        PENDING,      // 분석 대기 중
        IN_PROGRESS,  // 분석 진행 중
        COMPLETED,    // 분석 완료
        FAILED        // 분석 실패
    }

    public void startAnalysis() {
        this.status = AnalysisStatus.IN_PROGRESS;
    }

    public void completeAnalysis(String summary, Double confidence, String keywords,
                                  String possibleCauses, String relatedLogs, String recommendation) {
        this.status = AnalysisStatus.COMPLETED;
        this.summary = summary;
        this.confidence = confidence;
        this.keywords = keywords;
        this.possibleCauses = possibleCauses;
        this.relatedLogs = relatedLogs;
        this.recommendation = recommendation;
        this.analyzedAt = LocalDateTime.now();
    }

    public void failAnalysis(String errorMessage) {
        this.status = AnalysisStatus.FAILED;
        this.errorMessage = errorMessage;
        this.analyzedAt = LocalDateTime.now();
    }

    public boolean isCompleted() {
        return status == AnalysisStatus.COMPLETED;
    }

    public boolean isPending() {
        return status == AnalysisStatus.PENDING || status == AnalysisStatus.IN_PROGRESS;
    }
}
