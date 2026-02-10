package com.geonho.vocautobot.domain.voc;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("VocDomain 도메인 모델 테스트")
class VocDomainTest {

    private static VocDomain createNewVoc() {
        return VocDomain.create(
                "VOC-20260210-0001",
                "배송 지연 문의",
                "주문한 상품이 3일째 배송되지 않습니다.",
                1L,
                "customer@example.com",
                "홍길동",
                "010-1234-5678",
                VocPriority.NORMAL
        );
    }

    @Nested
    @DisplayName("VOC 생성")
    class Create {

        @Test
        @DisplayName("유효한 값으로 VOC 생성 성공")
        void shouldCreateVocWithValidInput() {
            VocDomain voc = createNewVoc();

            assertThat(voc.getTicketId()).isEqualTo("VOC-20260210-0001");
            assertThat(voc.getTitle()).isEqualTo("배송 지연 문의");
            assertThat(voc.getStatus()).isEqualTo(VocStatus.NEW);
            assertThat(voc.getPriority()).isEqualTo(VocPriority.NORMAL);
            assertThat(voc.getCustomerEmail()).isEqualTo("customer@example.com");
        }

        @Test
        @DisplayName("우선순위 null이면 NORMAL로 기본 설정")
        void shouldDefaultToNormalPriority() {
            VocDomain voc = VocDomain.create(
                    "VOC-001", "제목", "내용", 1L,
                    "test@example.com", "이름", null, null
            );

            assertThat(voc.getPriority()).isEqualTo(VocPriority.NORMAL);
        }

        @Test
        @DisplayName("ticketId 누락 시 예외 발생")
        void shouldThrowWhenTicketIdMissing() {
            assertThatThrownBy(() -> VocDomain.create(
                    null, "제목", "내용", 1L,
                    "test@example.com", "이름", null, null
            )).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ticketId");
        }

        @Test
        @DisplayName("제목 누락 시 예외 발생")
        void shouldThrowWhenTitleMissing() {
            assertThatThrownBy(() -> VocDomain.create(
                    "VOC-001", "", "내용", 1L,
                    "test@example.com", "이름", null, null
            )).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("title");
        }

        @Test
        @DisplayName("내용 누락 시 예외 발생")
        void shouldThrowWhenContentMissing() {
            assertThatThrownBy(() -> VocDomain.create(
                    "VOC-001", "제목", null, 1L,
                    "test@example.com", "이름", null, null
            )).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("content");
        }

        @Test
        @DisplayName("이메일 누락 시 예외 발생")
        void shouldThrowWhenEmailMissing() {
            assertThatThrownBy(() -> VocDomain.create(
                    "VOC-001", "제목", "내용", 1L,
                    "", "이름", null, null
            )).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("customerEmail");
        }
    }

    @Nested
    @DisplayName("상태 전이 테스트")
    class StatusTransition {

        @Test
        @DisplayName("NEW -> IN_PROGRESS 전이 성공")
        void shouldTransitionFromNewToInProgress() {
            VocDomain voc = createNewVoc();

            voc.updateStatus(VocStatus.IN_PROGRESS);

            assertThat(voc.getStatus()).isEqualTo(VocStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("NEW -> RESOLVED 전이 성공하면 resolvedAt 설정")
        void shouldSetResolvedAtWhenTransitionToResolved() {
            VocDomain voc = createNewVoc();

            voc.updateStatus(VocStatus.RESOLVED);

            assertThat(voc.getStatus()).isEqualTo(VocStatus.RESOLVED);
            assertThat(voc.getResolvedAt()).isNotNull();
        }

        @Test
        @DisplayName("NEW -> REJECTED 전이 성공")
        void shouldTransitionFromNewToRejected() {
            VocDomain voc = createNewVoc();

            voc.updateStatus(VocStatus.REJECTED);

            assertThat(voc.getStatus()).isEqualTo(VocStatus.REJECTED);
        }

        @Test
        @DisplayName("IN_PROGRESS -> RESOLVED 전이 성공")
        void shouldTransitionFromInProgressToResolved() {
            VocDomain voc = createNewVoc();
            voc.updateStatus(VocStatus.IN_PROGRESS);

            voc.updateStatus(VocStatus.RESOLVED);

            assertThat(voc.getStatus()).isEqualTo(VocStatus.RESOLVED);
        }

        @Test
        @DisplayName("RESOLVED에서 다른 상태 전이 불가")
        void shouldNotTransitionFromResolved() {
            VocDomain voc = createNewVoc();
            voc.updateStatus(VocStatus.RESOLVED);

            assertThatThrownBy(() -> voc.updateStatus(VocStatus.IN_PROGRESS))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition");
        }

        @Test
        @DisplayName("REJECTED에서 다른 상태 전이 불가")
        void shouldNotTransitionFromRejected() {
            VocDomain voc = createNewVoc();
            voc.updateStatus(VocStatus.REJECTED);

            assertThatThrownBy(() -> voc.updateStatus(VocStatus.NEW))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition");
        }

        @Test
        @DisplayName("null 상태로 전이 시 예외 발생")
        void shouldThrowWhenNewStatusIsNull() {
            VocDomain voc = createNewVoc();

            assertThatThrownBy(() -> voc.updateStatus(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("null");
        }
    }

    @Nested
    @DisplayName("담당자 배정")
    class Assign {

        @Test
        @DisplayName("NEW 상태에서 담당자 배정 시 IN_PROGRESS로 전환")
        void shouldTransitionToInProgressWhenAssigned() {
            VocDomain voc = createNewVoc();

            voc.assign(5L);

            assertThat(voc.getAssigneeId()).isEqualTo(5L);
            assertThat(voc.getStatus()).isEqualTo(VocStatus.IN_PROGRESS);
            assertThat(voc.isAssigned()).isTrue();
        }

        @Test
        @DisplayName("IN_PROGRESS 상태에서 담당자 변경 시 상태 유지")
        void shouldKeepStatusWhenReassigned() {
            VocDomain voc = createNewVoc();
            voc.updateStatus(VocStatus.IN_PROGRESS);

            voc.assign(10L);

            assertThat(voc.getAssigneeId()).isEqualTo(10L);
            assertThat(voc.getStatus()).isEqualTo(VocStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("담당자 해제")
        void shouldUnassign() {
            VocDomain voc = createNewVoc();
            voc.assign(5L);

            voc.unassign();

            assertThat(voc.getAssigneeId()).isNull();
            assertThat(voc.isAssigned()).isFalse();
        }
    }

    @Nested
    @DisplayName("정보 수정")
    class UpdateInfo {

        @Test
        @DisplayName("제목과 내용 수정 성공")
        void shouldUpdateTitleAndContent() {
            VocDomain voc = createNewVoc();

            voc.updateInfo("수정된 제목", "수정된 내용");

            assertThat(voc.getTitle()).isEqualTo("수정된 제목");
            assertThat(voc.getContent()).isEqualTo("수정된 내용");
        }

        @Test
        @DisplayName("null이나 빈 값은 무시됨")
        void shouldIgnoreNullOrBlankValues() {
            VocDomain voc = createNewVoc();
            String originalTitle = voc.getTitle();
            String originalContent = voc.getContent();

            voc.updateInfo(null, "");

            assertThat(voc.getTitle()).isEqualTo(originalTitle);
            assertThat(voc.getContent()).isEqualTo(originalContent);
        }

        @Test
        @DisplayName("우선순위 변경")
        void shouldUpdatePriority() {
            VocDomain voc = createNewVoc();

            voc.updatePriority(VocPriority.URGENT);

            assertThat(voc.getPriority()).isEqualTo(VocPriority.URGENT);
        }

        @Test
        @DisplayName("카테고리 변경")
        void shouldUpdateCategory() {
            VocDomain voc = createNewVoc();

            voc.updateCategory(2L);

            assertThat(voc.getCategoryId()).isEqualTo(2L);
        }
    }

    @Nested
    @DisplayName("메모 관리")
    class MemoManagement {

        @Test
        @DisplayName("메모 추가")
        void shouldAddMemo() {
            VocDomain voc = createNewVoc();
            VocMemoDomain memo = VocMemoDomain.create(1L, "테스트 메모", false);

            voc.addMemo(memo);

            assertThat(voc.getMemos()).hasSize(1);
        }

        @Test
        @DisplayName("null 메모는 무시됨")
        void shouldIgnoreNullMemo() {
            VocDomain voc = createNewVoc();

            voc.addMemo(null);

            assertThat(voc.getMemos()).isEmpty();
        }
    }

    @Nested
    @DisplayName("첨부파일 관리")
    class AttachmentManagement {

        @Test
        @DisplayName("첨부파일 추가")
        void shouldAddAttachment() {
            VocDomain voc = createNewVoc();
            VocAttachmentDomain attachment = VocAttachmentDomain.create(
                    "test.pdf", "stored-test.pdf", "/uploads/test.pdf",
                    1024L, "application/pdf"
            );

            voc.addAttachment(attachment);

            assertThat(voc.getAttachments()).hasSize(1);
        }

        @Test
        @DisplayName("첨부파일 제거")
        void shouldRemoveAttachment() {
            VocDomain voc = createNewVoc();
            VocAttachmentDomain attachment = VocAttachmentDomain.create(
                    "test.pdf", "stored-test.pdf", "/uploads/test.pdf",
                    1024L, "application/pdf"
            );
            voc.addAttachment(attachment);

            voc.removeAttachment(attachment);

            assertThat(voc.getAttachments()).isEmpty();
        }
    }

    @Nested
    @DisplayName("유틸리티 메서드")
    class UtilityMethods {

        @Test
        @DisplayName("isResolved()는 RESOLVED 또는 CLOSED 상태에서 true")
        void shouldReturnTrueForResolvedOrClosed() {
            VocDomain voc = createNewVoc();
            assertThat(voc.isResolved()).isFalse();

            voc.updateStatus(VocStatus.RESOLVED);
            assertThat(voc.isResolved()).isTrue();
        }

        @Test
        @DisplayName("isNew()는 id가 null인 경우 true")
        void shouldReturnTrueWhenIdIsNull() {
            VocDomain voc = createNewVoc();

            assertThat(voc.isNew()).isTrue();
        }

        @Test
        @DisplayName("getEmbeddingSourceText()는 제목과 내용 결합")
        void shouldReturnCombinedText() {
            VocDomain voc = createNewVoc();

            String embedText = voc.getEmbeddingSourceText();

            assertThat(embedText).isEqualTo("배송 지연 문의\n주문한 상품이 3일째 배송되지 않습니다.");
        }
    }
}
