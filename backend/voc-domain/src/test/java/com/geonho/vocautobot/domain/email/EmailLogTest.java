package com.geonho.vocautobot.domain.email;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("EmailLog 도메인 엔티티 테스트")
class EmailLogTest {

    @Test
    @DisplayName("이메일 로그 생성 성공")
    void create_shouldCreateEmailLog_whenValidInput() {
        EmailLog emailLog = EmailLog.create(1L, "user@example.com", "홍길동", "제목", "본문");

        assertThat(emailLog).isNotNull();
        assertThat(emailLog.getStatus()).isEqualTo(EmailStatus.PENDING);
        assertThat(emailLog.isPending()).isTrue();
    }

    @Test
    @DisplayName("발송 성공 처리")
    void markAsSent_shouldUpdateStatusToSent() {
        EmailLog emailLog = EmailLog.create(1L, "user@example.com", "홍길동", "제목", "본문");

        emailLog.markAsSent();

        assertThat(emailLog.getStatus()).isEqualTo(EmailStatus.SENT);
        assertThat(emailLog.isSent()).isTrue();
        assertThat(emailLog.getSentAt()).isNotNull();
    }

    @Test
    @DisplayName("발송 실패 처리")
    void markAsFailed_shouldUpdateStatusToFailed() {
        EmailLog emailLog = EmailLog.create(1L, "user@example.com", "홍길동", "제목", "본문");

        emailLog.markAsFailed("SMTP 연결 실패");

        assertThat(emailLog.getStatus()).isEqualTo(EmailStatus.FAILED);
        assertThat(emailLog.isFailed()).isTrue();
    }
}
