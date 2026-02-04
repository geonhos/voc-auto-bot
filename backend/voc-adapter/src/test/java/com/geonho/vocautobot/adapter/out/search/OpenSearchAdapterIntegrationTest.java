package com.geonho.vocautobot.adapter.out.search;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * OpenSearchAdapter 통합 테스트
 * Testcontainers를 사용하여 실제 OpenSearch 컨테이너와 연동 테스트
 *
 * NOTE: This test requires opensearch-testcontainers dependency.
 * Currently disabled until dependency is added.
 *
 * To enable this test:
 * 1. Add to build.gradle: testImplementation 'org.opensearch:opensearch-testcontainers:2.0.1'
 * 2. Uncomment the test methods and container setup
 */
@Disabled("OpenSearch Testcontainers dependency not available - requires org.opensearch:opensearch-testcontainers")
@DisplayName("OpenSearchAdapter 통합 테스트")
class OpenSearchAdapterIntegrationTest {

    @Test
    @DisplayName("Placeholder test - integration tests disabled")
    void placeholderTest() {
        // This test class requires opensearch-testcontainers dependency
        // See class-level Javadoc for enabling instructions
    }
}
