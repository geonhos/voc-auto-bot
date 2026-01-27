package com.geonho.vocautobot.application.analysis.port.out;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;

import java.time.LocalDateTime;

/**
 * 로그 검색을 위한 Output Port
 * OpenSearch를 이용한 로그 검색을 추상화
 */
public interface LogSearchPort {

    /**
     * 로그 검색
     *
     * @param query 검색 쿼리
     * @param startTime 검색 시작 시간
     * @param endTime 검색 종료 시간
     * @param maxResults 최대 결과 개수
     * @return 로그 분석 결과
     */
    LogAnalysisResult searchLogs(String query, LocalDateTime startTime, LocalDateTime endTime, int maxResults);

    /**
     * 에러 로그 검색
     *
     * @param serviceName 서비스명 (null일 경우 모든 서비스)
     * @param startTime 검색 시작 시간
     * @param endTime 검색 종료 시간
     * @param maxResults 최대 결과 개수
     * @return 로그 분석 결과
     */
    LogAnalysisResult searchErrorLogs(String serviceName, LocalDateTime startTime, LocalDateTime endTime, int maxResults);

    /**
     * 로그 통계 조회
     *
     * @param startTime 검색 시작 시간
     * @param endTime 검색 종료 시간
     * @return 로그 분석 결과 (통계 정보 포함)
     */
    LogAnalysisResult getLogStatistics(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 특정 서비스의 로그 검색
     *
     * @param serviceName 서비스명
     * @param logLevel 로그 레벨 (INFO, WARN, ERROR 등, null일 경우 모든 레벨)
     * @param startTime 검색 시작 시간
     * @param endTime 검색 종료 시간
     * @param maxResults 최대 결과 개수
     * @return 로그 분석 결과
     */
    LogAnalysisResult searchServiceLogs(
        String serviceName,
        String logLevel,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int maxResults
    );
}
