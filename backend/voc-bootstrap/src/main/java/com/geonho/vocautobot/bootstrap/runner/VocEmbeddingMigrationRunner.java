package com.geonho.vocautobot.bootstrap.runner;

import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.domain.voc.VocDomain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * VOC 임베딩 마이그레이션 Runner
 * 애플리케이션 시작 시 임베딩이 없는 VOC에 대해 pgvector 임베딩을 생성합니다.
 * 멱등성을 보장하여 이미 임베딩이 존재하는 VOC는 건너뜁니다.
 */
@Component
@Profile("!test")
public class VocEmbeddingMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(VocEmbeddingMigrationRunner.class);
    private static final int PAGE_SIZE = 50;

    private final VectorSearchPort vectorSearchPort;
    private final LoadVocPort loadVocPort;

    public VocEmbeddingMigrationRunner(
            VectorSearchPort vectorSearchPort,
            LoadVocPort loadVocPort
    ) {
        this.vectorSearchPort = vectorSearchPort;
        this.loadVocPort = loadVocPort;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting VOC embedding migration...");

        int totalProcessed = 0;
        int totalSkipped = 0;
        int totalFailed = 0;
        int pageNumber = 0;

        try {
            Page<VocDomain> page;
            do {
                Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
                page = loadVocPort.loadVocList(null, null, null, null, null, null, pageable);

                List<VocDomain> vocs = page.getContent();

                // Batch check: find VOC IDs that already have embeddings
                List<Long> vocIds = vocs.stream().map(VocDomain::getId).toList();
                Set<Long> existingIds = vectorSearchPort.findVocIdsWithEmbeddings(vocIds);

                for (VocDomain voc : vocs) {
                    if (existingIds.contains(voc.getId())) {
                        totalSkipped++;
                        continue;
                    }

                    try {
                        vectorSearchPort.saveEmbedding(voc.getId(), voc.getEmbeddingSourceText());
                        totalProcessed++;
                    } catch (Exception e) {
                        totalFailed++;
                        log.warn("Failed to migrate embedding for VOC ID: {}: {}",
                                voc.getId(), e.getMessage());
                    }
                }

                pageNumber++;
            } while (page.hasNext());

            log.info("VOC embedding migration completed: {} embedded, {} skipped, {} failed (total VOCs: {})",
                    totalProcessed, totalSkipped, totalFailed,
                    totalProcessed + totalSkipped + totalFailed);

        } catch (Exception e) {
            log.error("VOC embedding migration failed unexpectedly", e);
        }
    }
}
