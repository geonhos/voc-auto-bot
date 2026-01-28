package com.geonho.vocautobot.adapter.out.notification;

import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Unit tests for SlackNotificationAdapter
 */
class SlackNotificationAdapterTest {

    private MockWebServer mockWebServer;
    private SlackNotificationAdapter adapter;
    private SlackProperties properties;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        properties = new SlackProperties();
        properties.setWebhookUrl(mockWebServer.url("/webhook").toString());
        properties.setEnabled(true);
        properties.setUsername("Test Bot");
        properties.setIconEmoji(":robot:");

        adapter = new SlackNotificationAdapter(properties);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("VOC 생성 시 Slack 알림 전송 성공")
    void notifyVocCreated_shouldSendNotification() throws InterruptedException {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("ok"));

        Voc voc = createTestVoc();

        // when
        assertDoesNotThrow(() -> adapter.notifyVocCreated(voc));

        // then
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("POST");
        assertThat(request.getHeader(HttpHeaders.CONTENT_TYPE)).contains(MediaType.APPLICATION_JSON_VALUE);
        assertThat(request.getBody().readUtf8())
                .contains("VOC-001")
                .contains("Test VOC Title")
                .contains("NEW VOC");
    }

    @Test
    @DisplayName("VOC 상태 변경 시 Slack 알림 전송 성공")
    void notifyVocStatusChanged_shouldSendNotification() throws InterruptedException {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("ok"));

        Voc voc = createTestVoc();
        voc.updateStatus(VocStatus.IN_PROGRESS);
        String previousStatus = "NEW";

        // when
        assertDoesNotThrow(() -> adapter.notifyVocStatusChanged(voc, previousStatus));

        // then
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("POST");
        assertThat(request.getBody().readUtf8())
                .contains("VOC-001")
                .contains("STATUS CHANGED")
                .contains("NEW")
                .contains("IN_PROGRESS");
    }

    @Test
    @DisplayName("VOC 할당 시 Slack 알림 전송 성공")
    void notifyVocAssigned_shouldSendNotification() throws InterruptedException {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("ok"));

        Voc voc = createTestVoc();
        voc.assign(1L);
        String assigneeName = "John Doe";

        // when
        assertDoesNotThrow(() -> adapter.notifyVocAssigned(voc, assigneeName));

        // then
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("POST");
        assertThat(request.getBody().readUtf8())
                .contains("VOC-001")
                .contains("ASSIGNED")
                .contains("John Doe");
    }

    @Test
    @DisplayName("Slack 비활성화 시 알림 전송하지 않음")
    void notifyVocCreated_whenDisabled_shouldNotSendNotification() {
        // given
        properties.setEnabled(false);
        Voc voc = createTestVoc();

        // when & then
        assertDoesNotThrow(() -> adapter.notifyVocCreated(voc));
        assertThat(mockWebServer.getRequestCount()).isZero();
    }

    @Test
    @DisplayName("Webhook URL 미설정 시 알림 전송하지 않음")
    void notifyVocCreated_whenWebhookUrlNotSet_shouldNotSendNotification() {
        // given
        properties.setWebhookUrl(null);
        Voc voc = createTestVoc();

        // when & then
        assertDoesNotThrow(() -> adapter.notifyVocCreated(voc));
        assertThat(mockWebServer.getRequestCount()).isZero();
    }

    @Test
    @DisplayName("Slack API 오류 발생 시 예외를 던지지 않음 (트랜잭션 롤백 방지)")
    void notifyVocCreated_whenApiError_shouldNotThrowException() {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("Internal Server Error"));

        Voc voc = createTestVoc();

        // when & then - should not throw exception
        assertDoesNotThrow(() -> adapter.notifyVocCreated(voc));
    }

    @Test
    @DisplayName("우선순위에 따른 이모지 표시 확인")
    void notifyVocCreated_shouldIncludePriorityEmoji() throws InterruptedException {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("ok"));

        Voc urgentVoc = Voc.builder()
                .ticketId("VOC-URGENT")
                .title("Urgent VOC")
                .content("Urgent content")
                .categoryId(1L)
                .customerEmail("urgent@test.com")
                .customerName("Urgent Customer")
                .priority(VocPriority.URGENT)
                .build();

        // when
        adapter.notifyVocCreated(urgentVoc);

        // then
        RecordedRequest request = mockWebServer.takeRequest();
        String body = request.getBody().readUtf8();
        assertThat(body).contains("🔴"); // URGENT emoji
    }

    @Test
    @DisplayName("긴 내용은 미리보기로 잘림")
    void notifyVocCreated_shouldTruncateLongContent() throws InterruptedException {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("ok"));

        String longContent = "A".repeat(150);
        Voc voc = Voc.builder()
                .ticketId("VOC-LONG")
                .title("Long Content VOC")
                .content(longContent)
                .categoryId(1L)
                .customerEmail("test@test.com")
                .customerName("Test Customer")
                .priority(VocPriority.NORMAL)
                .build();

        // when
        adapter.notifyVocCreated(voc);

        // then
        RecordedRequest request = mockWebServer.takeRequest();
        String body = request.getBody().readUtf8();
        assertThat(body).contains("..."); // Content should be truncated
    }

    /**
     * Create test VOC entity
     */
    private Voc createTestVoc() {
        return Voc.builder()
                .ticketId("VOC-001")
                .title("Test VOC Title")
                .content("Test VOC Content")
                .categoryId(1L)
                .customerEmail("customer@test.com")
                .customerName("Test Customer")
                .customerPhone("010-1234-5678")
                .priority(VocPriority.NORMAL)
                .build();
    }
}
