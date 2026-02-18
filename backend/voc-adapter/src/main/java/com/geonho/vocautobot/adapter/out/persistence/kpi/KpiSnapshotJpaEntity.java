package com.geonho.vocautobot.adapter.out.persistence.kpi;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "kpi_daily_snapshot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KpiSnapshotJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_date", nullable = false, unique = true)
    private LocalDate snapshotDate;

    @Column(name = "total_vocs", nullable = false)
    private long totalVocs;

    @Column(name = "today_vocs", nullable = false)
    private long todayVocs;

    @Column(name = "resolved_vocs", nullable = false)
    private long resolvedVocs;

    @Column(name = "avg_resolution_hours")
    private Double avgResolutionHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "category_stats", columnDefinition = "jsonb")
    private Map<String, Long> categoryStats;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "priority_stats", columnDefinition = "jsonb")
    private Map<String, Long> priorityStats;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public KpiSnapshotJpaEntity(LocalDate snapshotDate, long totalVocs, long todayVocs,
                                 long resolvedVocs, Double avgResolutionHours,
                                 Map<String, Long> categoryStats,
                                 Map<String, Long> priorityStats) {
        this.snapshotDate = snapshotDate;
        this.totalVocs = totalVocs;
        this.todayVocs = todayVocs;
        this.resolvedVocs = resolvedVocs;
        this.avgResolutionHours = avgResolutionHours;
        this.categoryStats = categoryStats;
        this.priorityStats = priorityStats;
        this.createdAt = LocalDateTime.now();
    }
}
