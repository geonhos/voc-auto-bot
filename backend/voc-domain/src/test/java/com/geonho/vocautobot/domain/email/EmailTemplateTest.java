package com.geonho.vocautobot.domain.email;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("EmailTemplate 도메인 엔티티 테스트")
class EmailTemplateTest {

    @Test
    @DisplayName("이메일 템플릿 생성 성공")
    void create_shouldCreateTemplate_whenValidInput() {
        String name = "VOC 완료 안내";
        String subject = "[{{ticketId}}] VOC 처리 완료";
        String body = "고객님께서 문의하신 {{title}} 건이 처리 완료되었습니다.";
        java.util.List<String> variables = Arrays.asList("ticketId", "title");

        EmailTemplate template = EmailTemplate.create(name, subject, body, variables);

        assertThat(template).isNotNull();
        assertThat(template.getName()).isEqualTo(name);
        assertThat(template.isActive()).isTrue();
    }

    @Test
    @DisplayName("템플릿 변수 치환 성공")
    void replaceVariables_shouldReplaceCorrectly() {
        EmailTemplate template = EmailTemplate.create(
                "VOC 완료 안내",
                "[{{ticketId}}] VOC 처리 완료",
                "고객님께서 문의하신 {{title}} 건이 처리 완료되었습니다.",
                Arrays.asList("ticketId", "title")
        );

        Map<String, String> values = new HashMap<>();
        values.put("ticketId", "VOC-20260125-00001");
        values.put("title", "결제 오류");

        String resolvedSubject = template.getResolvedSubject(values);
        String resolvedBody = template.getResolvedBody(values);

        assertThat(resolvedSubject).isEqualTo("[VOC-20260125-00001] VOC 처리 완료");
        assertThat(resolvedBody).isEqualTo("고객님께서 문의하신 결제 오류 건이 처리 완료되었습니다.");
    }
}
