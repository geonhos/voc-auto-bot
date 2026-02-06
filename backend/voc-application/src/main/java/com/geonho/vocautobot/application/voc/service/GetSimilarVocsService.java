package com.geonho.vocautobot.application.voc.service;

import com.geonho.vocautobot.application.voc.exception.VocNotFoundException;
import com.geonho.vocautobot.application.voc.port.in.GetSimilarVocsUseCase;
import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SimilarVocPort;
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
 * Calls AI service for vector similarity search and enriches results
 * with VOC metadata from the persistence layer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetSimilarVocsService implements GetSimilarVocsUseCase {

    private final LoadVocPort loadVocPort;
    private final SimilarVocPort similarVocPort;

    @Override
    public List<SimilarVocResult> getSimilarVocs(Long vocId, int limit) {
        // 1. Load the source VOC to get its content
        VocDomain sourceVoc = loadVocPort.loadVocById(vocId)
                .orElseThrow(() -> new VocNotFoundException(vocId));

        // 2. Call AI service for vector similarity search
        String searchContent = sourceVoc.getTitle() + "\n" + sourceVoc.getContent();
        List<SimilarVocPort.SimilarVocResult> aiResults =
                similarVocPort.findSimilarVocs(vocId, searchContent, limit + 1);

        // 3. Batch load VOC metadata to avoid N+1 queries
        List<Long> similarVocIds = aiResults.stream()
                .map(SimilarVocPort.SimilarVocResult::vocId)
                .filter(id -> !id.equals(vocId))
                .toList();

        Map<Long, VocDomain> vocMap = loadVocPort.loadVocsByIds(similarVocIds).stream()
                .collect(Collectors.toMap(VocDomain::getId, v -> v));

        // 4. Enrich results with VOC metadata
        List<SimilarVocResult> enrichedResults = new ArrayList<>();
        for (SimilarVocPort.SimilarVocResult aiResult : aiResults) {
            if (aiResult.vocId().equals(vocId)) {
                continue;
            }

            VocDomain voc = vocMap.get(aiResult.vocId());
            if (voc != null) {
                enrichedResults.add(new SimilarVocResult(
                        voc.getId(),
                        voc.getTicketId(),
                        voc.getTitle(),
                        voc.getStatus(),
                        aiResult.similarity(),
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
