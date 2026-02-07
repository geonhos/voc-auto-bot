package com.geonho.vocautobot.application.voc.service;

import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort;
import com.geonho.vocautobot.application.voc.exception.VocNotFoundException;
import com.geonho.vocautobot.application.voc.port.in.GetSimilarVocsUseCase;
import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.domain.voc.VocDomain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service implementing similar VOC search use case.
 * Uses pgvector-based vector similarity search and enriches results
 * with VOC metadata from the persistence layer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetSimilarVocsService implements GetSimilarVocsUseCase {

    private final LoadVocPort loadVocPort;
    private final VectorSearchPort vectorSearchPort;

    @Override
    public List<SimilarVocResult> getSimilarVocs(Long vocId, int limit) {
        // 1. Verify the source VOC exists
        loadVocPort.loadVocById(vocId)
                .orElseThrow(() -> new VocNotFoundException(vocId));

        // 2. pgvector similarity search (SQL already excludes self)
        List<VectorSearchPort.SimilarVocResult> aiResults =
                vectorSearchPort.findSimilarVocs(vocId, limit, 0.7);

        // 3. Batch load VOC metadata to avoid N+1 queries
        List<Long> similarVocIds = aiResults.stream()
                .map(VectorSearchPort.SimilarVocResult::vocId)
                .toList();

        Map<Long, VocDomain> vocMap = loadVocPort.loadVocsByIds(similarVocIds).stream()
                .collect(Collectors.toMap(VocDomain::getId, v -> v));

        // 4. Enrich results with VOC metadata
        List<SimilarVocResult> enrichedResults = new ArrayList<>();
        for (VectorSearchPort.SimilarVocResult aiResult : aiResults) {
            VocDomain voc = vocMap.get(aiResult.vocId());
            if (voc != null) {
                enrichedResults.add(new SimilarVocResult(
                        voc.getId(),
                        voc.getTicketId(),
                        voc.getTitle(),
                        voc.getStatus(),
                        aiResult.similarityScore(),
                        voc.getCreatedAt()
                ));
            }

            if (enrichedResults.size() >= limit) {
                break;
            }
        }

        log.info("Found {} similar VOCs for VOC ID: {}", enrichedResults.size(), vocId);
        return enrichedResults;
    }
}
