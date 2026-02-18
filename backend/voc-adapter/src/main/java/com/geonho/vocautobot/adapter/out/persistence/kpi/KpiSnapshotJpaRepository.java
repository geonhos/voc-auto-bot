package com.geonho.vocautobot.adapter.out.persistence.kpi;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface KpiSnapshotJpaRepository extends JpaRepository<KpiSnapshotJpaEntity, Long> {

    Optional<KpiSnapshotJpaEntity> findBySnapshotDate(LocalDate snapshotDate);

    List<KpiSnapshotJpaEntity> findBySnapshotDateBetweenOrderBySnapshotDateAsc(
            LocalDate startDate, LocalDate endDate);
}
