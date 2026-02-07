package com.geonho.vocautobot.application.voc.port.out;

import java.util.List;

/**
 * Output port for finding similar VOCs via AI service.
 * Implementations call the Python AI service to perform vector similarity search.
 */
public interface SimilarVocPort {

    /**
     * Find VOCs similar to the given content.
     *
     * @param vocId   the VOC ID to find similar VOCs for
     * @param content the VOC content to use as search query
     * @param limit   maximum number of results
     * @return list of similar VOC results with similarity scores
     */
    List<SimilarVocResult> findSimilarVocs(Long vocId, String content, int limit);

    /**
     * Index a VOC into the vector database for future similarity searches.
     *
     * @param vocId    the VOC ID
     * @param title    the VOC title
     * @param content  the VOC content
     * @param category the VOC category name (nullable)
     * @return true if indexing was successful
     */
    boolean indexVoc(Long vocId, String title, String content, String category);

    /**
     * Result record for a similar VOC.
     *
     * @param vocId      the similar VOC's ID
     * @param similarity the similarity score (0.0 to 1.0)
     */
    record SimilarVocResult(Long vocId, double similarity) {
    }
}
