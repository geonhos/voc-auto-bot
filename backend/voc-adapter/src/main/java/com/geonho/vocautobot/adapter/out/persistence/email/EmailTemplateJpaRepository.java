package com.geonho.vocautobot.adapter.out.persistence.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailTemplateJpaRepository extends JpaRepository<EmailTemplateJpaEntity, Long> {

    /**
     * 이름으로 템플릿 조회
     */
    Optional<EmailTemplateJpaEntity> findByName(String name);

    /**
     * 활성화된 템플릿 목록 조회
     */
    List<EmailTemplateJpaEntity> findByIsActiveTrue();

    /**
     * 이름 존재 여부 확인
     */
    boolean existsByName(String name);

    /**
     * 이름 존재 여부 확인 (특정 ID 제외)
     */
    boolean existsByNameAndIdNot(String name, Long id);
}
