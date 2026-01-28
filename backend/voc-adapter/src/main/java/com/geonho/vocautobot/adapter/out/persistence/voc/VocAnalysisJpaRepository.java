package com.geonho.vocautobot.adapter.out.persistence.voc;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * VOC 분석 결과 JPA 레포지토리
 */
@Repository
public interface VocAnalysisJpaRepository extends JpaRepository<VocAnalysisJpaEntity, Long> {

    Optional<VocAnalysisJpaEntity> findByVocId(Long vocId);

    boolean existsByVocId(Long vocId);
}
