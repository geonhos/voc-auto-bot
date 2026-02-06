package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;

import java.util.List;

/**
 * Use case for retrieving similar VOCs.
 * Uses AI-based vector search to find VOCs similar to a given VOC.
 */
public interface GetSimilarVocsUseCase {

    /**
     * Find VOCs similar to the specified VOC.
     *
     * @param vocId the VOC ID to find similar VOCs for
     * @param limit maximum number of results
     * @return list of similar VOC results with metadata
     */
    List<SimilarVocResult> getSimilarVocs(Long vocId, int limit);
}
