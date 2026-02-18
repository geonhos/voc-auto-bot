package com.geonho.vocautobot.adapter.out.persistence.kpi;

import com.geonho.vocautobot.application.kpi.port.out.LoadKpiSnapshotPort;
import com.geonho.vocautobot.application.kpi.port.out.SaveKpiSnapshotPort;
import com.geonho.vocautobot.domain.kpi.KpiSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class KpiSnapshotPersistenceAdapter implements SaveKpiSnapshotPort, LoadKpiSnapshotPort {

    private final KpiSnapshotJpaRepository repository;

    @Override
    public KpiSnapshot save(KpiSnapshot snapshot) {
        KpiSnapshotJpaEntity entity = new KpiSnapshotJpaEntity(
                snapshot.snapshotDate(),
                snapshot.totalVocs(),
                snapshot.todayVocs(),
                snapshot.resolvedVocs(),
                snapshot.avgResolutionHours(),
                snapshot.categoryStats(),
                snapshot.priorityStats()
        );
        KpiSnapshotJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<KpiSnapshot> findByDate(LocalDate date) {
        return repository.findBySnapshotDate(date).map(this::toDomain);
    }

    @Override
    public List<KpiSnapshot> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findBySnapshotDateBetweenOrderBySnapshotDateAsc(startDate, endDate)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    private KpiSnapshot toDomain(KpiSnapshotJpaEntity entity) {
        return new KpiSnapshot(
                entity.getId(),
                entity.getSnapshotDate(),
                entity.getTotalVocs(),
                entity.getTodayVocs(),
                entity.getResolvedVocs(),
                entity.getAvgResolutionHours(),
                entity.getCategoryStats(),
                entity.getPriorityStats(),
                entity.getCreatedAt()
        );
    }
}
