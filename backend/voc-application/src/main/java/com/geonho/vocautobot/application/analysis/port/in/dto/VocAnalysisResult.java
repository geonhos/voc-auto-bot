package com.geonho.vocautobot.application.analysis.port.in.dto;

import java.util.List;

/**
 * VOC 분석 결과 DTO
 */
public class VocAnalysisResult {

    private final List<CategorySuggestion> categorySuggestions;
    private final PrioritySuggestion prioritySuggestion;
    private final List<String> keywords;
    private final String sentiment;
    private final List<SimilarVoc> similarVocs;

    public VocAnalysisResult(
            List<CategorySuggestion> categorySuggestions,
            PrioritySuggestion prioritySuggestion,
            List<String> keywords,
            String sentiment,
            List<SimilarVoc> similarVocs) {
        this.categorySuggestions = categorySuggestions;
        this.prioritySuggestion = prioritySuggestion;
        this.keywords = keywords;
        this.sentiment = sentiment;
        this.similarVocs = similarVocs;
    }

    public List<CategorySuggestion> getCategorySuggestions() {
        return categorySuggestions;
    }

    public PrioritySuggestion getPrioritySuggestion() {
        return prioritySuggestion;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public String getSentiment() {
        return sentiment;
    }

    public List<SimilarVoc> getSimilarVocs() {
        return similarVocs;
    }

    /**
     * 카테고리 추천 정보
     */
    public static class CategorySuggestion {
        private final String categoryName;
        private final Double confidence;
        private final String reason;

        public CategorySuggestion(String categoryName, Double confidence, String reason) {
            this.categoryName = categoryName;
            this.confidence = confidence;
            this.reason = reason;
        }

        public String getCategoryName() {
            return categoryName;
        }

        public Double getConfidence() {
            return confidence;
        }

        public String getReason() {
            return reason;
        }
    }

    /**
     * 우선순위 추천 정보
     */
    public static class PrioritySuggestion {
        private final String priority;
        private final Double confidence;
        private final String reason;

        public PrioritySuggestion(String priority, Double confidence, String reason) {
            this.priority = priority;
            this.confidence = confidence;
            this.reason = reason;
        }

        public String getPriority() {
            return priority;
        }

        public Double getConfidence() {
            return confidence;
        }

        public String getReason() {
            return reason;
        }
    }

    /**
     * 유사 VOC 정보
     */
    public static class SimilarVoc {
        private final Long vocId;
        private final String title;
        private final Double similarityScore;

        public SimilarVoc(Long vocId, String title, Double similarityScore) {
            this.vocId = vocId;
            this.title = title;
            this.similarityScore = similarityScore;
        }

        public Long getVocId() {
            return vocId;
        }

        public String getTitle() {
            return title;
        }

        public Double getSimilarityScore() {
            return similarityScore;
        }
    }
}
