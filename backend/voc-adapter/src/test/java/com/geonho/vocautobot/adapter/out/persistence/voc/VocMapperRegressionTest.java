package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.adapter.out.persistence.voc.mapper.VocMapper;
import com.geonho.vocautobot.domain.voc.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression tests for VocMapper.
 *
 * <p>These tests ensure that the Domain -> Entity -> Domain conversion cycle
 * maintains data integrity and field mapping accuracy.</p>
 *
 * <p>Test Coverage:</p>
 * <ul>
 *   <li>Domain to Entity conversion</li>
 *   <li>Entity to Domain conversion</li>
 *   <li>Round-trip consistency (Domain -> Entity -> Domain)</li>
 *   <li>All field mapping accuracy</li>
 *   <li>Null handling</li>
 *   <li>Collections (attachments, memos)</li>
 * </ul>
 */
@DisplayName("VocMapper Regression Tests")
class VocMapperRegressionTest {

    private VocMapper vocMapper;

    @BeforeEach
    void setUp() {
        vocMapper = new VocMapper();
    }

    @Nested
    @DisplayName("Domain to Entity Conversion Tests")
    class DomainToEntityTests {

        @Test
        @DisplayName("Should correctly map all basic fields from Domain to Entity")
        void shouldMapAllBasicFields() {
            // given
            VocDomain domain = createTestDomain();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);

            // then
            assertThat(entity).isNotNull();
            assertThat(entity.getTicketId()).isEqualTo(domain.getTicketId());
            assertThat(entity.getTitle()).isEqualTo(domain.getTitle());
            assertThat(entity.getContent()).isEqualTo(domain.getContent());
            assertThat(entity.getStatus()).isEqualTo(domain.getStatus());
            assertThat(entity.getPriority()).isEqualTo(domain.getPriority());
            assertThat(entity.getCategoryId()).isEqualTo(domain.getCategoryId());
            assertThat(entity.getCustomerEmail()).isEqualTo(domain.getCustomerEmail());
            assertThat(entity.getCustomerName()).isEqualTo(domain.getCustomerName());
            assertThat(entity.getCustomerPhone()).isEqualTo(domain.getCustomerPhone());
            assertThat(entity.getAssigneeId()).isEqualTo(domain.getAssigneeId());
        }

        @ParameterizedTest
        @EnumSource(VocStatus.class)
        @DisplayName("Should correctly map all VocStatus enum values")
        void shouldMapAllStatusValues(VocStatus status) {
            // given
            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-TEST-001")
                    .title("Test VOC")
                    .content("Test content")
                    .status(status)
                    .priority(VocPriority.NORMAL)
                    .categoryId(1L)
                    .customerEmail("test@example.com")
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);

            // then
            assertThat(entity.getStatus()).isEqualTo(status);
        }

        @ParameterizedTest
        @EnumSource(VocPriority.class)
        @DisplayName("Should correctly map all VocPriority enum values")
        void shouldMapAllPriorityValues(VocPriority priority) {
            // given
            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-TEST-001")
                    .title("Test VOC")
                    .content("Test content")
                    .status(VocStatus.NEW)
                    .priority(priority)
                    .categoryId(1L)
                    .customerEmail("test@example.com")
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);

            // then
            assertThat(entity.getPriority()).isEqualTo(priority);
        }

        @Test
        @DisplayName("Should handle null domain gracefully")
        void shouldHandleNullDomain() {
            // when
            VocJpaEntity entity = vocMapper.toEntity(null);

            // then
            assertThat(entity).isNull();
        }
    }

    @Nested
    @DisplayName("Entity to Domain Conversion Tests")
    class EntityToDomainTests {

        @Test
        @DisplayName("Should correctly map all basic fields from Entity to Domain")
        void shouldMapAllBasicFields() {
            // given
            VocJpaEntity entity = createTestEntity();

            // when
            VocDomain domain = vocMapper.toDomain(entity);

            // then
            assertThat(domain).isNotNull();
            assertThat(domain.getTicketId()).isEqualTo(entity.getTicketId());
            assertThat(domain.getTitle()).isEqualTo(entity.getTitle());
            assertThat(domain.getContent()).isEqualTo(entity.getContent());
            assertThat(domain.getStatus()).isEqualTo(entity.getStatus());
            assertThat(domain.getPriority()).isEqualTo(entity.getPriority());
            assertThat(domain.getCategoryId()).isEqualTo(entity.getCategoryId());
            assertThat(domain.getCustomerEmail()).isEqualTo(entity.getCustomerEmail());
            assertThat(domain.getCustomerName()).isEqualTo(entity.getCustomerName());
            assertThat(domain.getCustomerPhone()).isEqualTo(entity.getCustomerPhone());
            assertThat(domain.getAssigneeId()).isEqualTo(entity.getAssigneeId());
        }

        @Test
        @DisplayName("Should handle null entity gracefully")
        void shouldHandleNullEntity() {
            // when
            VocDomain domain = vocMapper.toDomain(null);

            // then
            assertThat(domain).isNull();
        }
    }

    @Nested
    @DisplayName("Round-Trip Consistency Tests")
    class RoundTripTests {

        @Test
        @DisplayName("Domain -> Entity -> Domain should preserve all basic fields")
        void shouldPreserveBasicFieldsInRoundTrip() {
            // given
            VocDomain original = createTestDomain();

            // when
            VocJpaEntity entity = vocMapper.toEntity(original);
            VocDomain restored = vocMapper.toDomain(entity);

            // then - verify key fields are preserved
            assertThat(restored.getTicketId()).isEqualTo(original.getTicketId());
            assertThat(restored.getTitle()).isEqualTo(original.getTitle());
            assertThat(restored.getContent()).isEqualTo(original.getContent());
            assertThat(restored.getStatus()).isEqualTo(original.getStatus());
            assertThat(restored.getPriority()).isEqualTo(original.getPriority());
            assertThat(restored.getCategoryId()).isEqualTo(original.getCategoryId());
            assertThat(restored.getCustomerEmail()).isEqualTo(original.getCustomerEmail());
            assertThat(restored.getCustomerName()).isEqualTo(original.getCustomerName());
            assertThat(restored.getCustomerPhone()).isEqualTo(original.getCustomerPhone());
            assertThat(restored.getAssigneeId()).isEqualTo(original.getAssigneeId());
        }

        @Test
        @DisplayName("Should preserve all VocStatus values through round-trip")
        void shouldPreserveStatusInRoundTrip() {
            for (VocStatus status : VocStatus.values()) {
                // given
                VocDomain original = VocDomain.builder()
                        .ticketId("VOC-RT-" + status.name())
                        .title("Test")
                        .content("Content")
                        .status(status)
                        .priority(VocPriority.NORMAL)
                        .categoryId(1L)
                        .customerEmail("test@test.com")
                        .attachments(new ArrayList<>())
                        .memos(new ArrayList<>())
                        .build();

                // when
                VocJpaEntity entity = vocMapper.toEntity(original);
                VocDomain restored = vocMapper.toDomain(entity);

                // then
                assertThat(restored.getStatus())
                        .as("Status %s should be preserved", status)
                        .isEqualTo(status);
            }
        }

        @Test
        @DisplayName("Should preserve all VocPriority values through round-trip")
        void shouldPreservePriorityInRoundTrip() {
            for (VocPriority priority : VocPriority.values()) {
                // given
                VocDomain original = VocDomain.builder()
                        .ticketId("VOC-RT-" + priority.name())
                        .title("Test")
                        .content("Content")
                        .status(VocStatus.NEW)
                        .priority(priority)
                        .categoryId(1L)
                        .customerEmail("test@test.com")
                        .attachments(new ArrayList<>())
                        .memos(new ArrayList<>())
                        .build();

                // when
                VocJpaEntity entity = vocMapper.toEntity(original);
                VocDomain restored = vocMapper.toDomain(entity);

                // then
                assertThat(restored.getPriority())
                        .as("Priority %s should be preserved", priority)
                        .isEqualTo(priority);
            }
        }
    }

    @Nested
    @DisplayName("Attachment Mapping Tests")
    class AttachmentMappingTests {

        @Test
        @DisplayName("Should correctly map attachment from domain to entity")
        void shouldMapAttachmentToEntity() {
            // given
            VocAttachmentDomain attachment = VocAttachmentDomain.builder()
                    .originalFilename("test.pdf")
                    .storedFilename("stored-123.pdf")
                    .filePath("/uploads/stored-123.pdf")
                    .fileSize(1024L)
                    .contentType("application/pdf")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            // when
            VocAttachmentJpaEntity entity = vocMapper.toAttachmentEntity(attachment);

            // then
            assertThat(entity).isNotNull();
            assertThat(entity.getOriginalFilename()).isEqualTo(attachment.getOriginalFilename());
            assertThat(entity.getStoredFilename()).isEqualTo(attachment.getStoredFilename());
            assertThat(entity.getFilePath()).isEqualTo(attachment.getFilePath());
            assertThat(entity.getFileSize()).isEqualTo(attachment.getFileSize());
            assertThat(entity.getContentType()).isEqualTo(attachment.getContentType());
        }

        @Test
        @DisplayName("Should correctly map attachment from entity to domain")
        void shouldMapAttachmentToDomain() {
            // given
            VocAttachmentJpaEntity entity = new VocAttachmentJpaEntity(
                    "original.jpg",
                    "stored-456.jpg",
                    "/uploads/stored-456.jpg",
                    2048L,
                    "image/jpeg"
            );

            // when
            VocAttachmentDomain domain = vocMapper.toAttachmentDomain(entity);

            // then
            assertThat(domain).isNotNull();
            assertThat(domain.getOriginalFilename()).isEqualTo(entity.getOriginalFilename());
            assertThat(domain.getStoredFilename()).isEqualTo(entity.getStoredFilename());
            assertThat(domain.getFilePath()).isEqualTo(entity.getFilePath());
            assertThat(domain.getFileSize()).isEqualTo(entity.getFileSize());
            assertThat(domain.getContentType()).isEqualTo(entity.getContentType());
        }

        @Test
        @DisplayName("Should handle null attachment gracefully")
        void shouldHandleNullAttachment() {
            assertThat(vocMapper.toAttachmentEntity(null)).isNull();
            assertThat(vocMapper.toAttachmentDomain(null)).isNull();
        }
    }

    @Nested
    @DisplayName("Memo Mapping Tests")
    class MemoMappingTests {

        @Test
        @DisplayName("Should correctly map memo from domain to entity")
        void shouldMapMemoToEntity() {
            // given
            VocMemoDomain memo = VocMemoDomain.builder()
                    .authorId(100L)
                    .content("This is a test memo")
                    .internal(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            // when
            VocMemoJpaEntity entity = vocMapper.toMemoEntity(memo);

            // then
            assertThat(entity).isNotNull();
            assertThat(entity.getAuthorId()).isEqualTo(memo.getAuthorId());
            assertThat(entity.getContent()).isEqualTo(memo.getContent());
            assertThat(entity.isInternal()).isEqualTo(memo.isInternal());
        }

        @Test
        @DisplayName("Should correctly map memo from entity to domain")
        void shouldMapMemoToDomain() {
            // given
            VocMemoJpaEntity entity = new VocMemoJpaEntity(200L, "Entity memo content", false);

            // when
            VocMemoDomain domain = vocMapper.toMemoDomain(entity);

            // then
            assertThat(domain).isNotNull();
            assertThat(domain.getAuthorId()).isEqualTo(entity.getAuthorId());
            assertThat(domain.getContent()).isEqualTo(entity.getContent());
            assertThat(domain.isInternal()).isEqualTo(entity.isInternal());
        }

        @Test
        @DisplayName("Should handle null memo gracefully")
        void shouldHandleNullMemo() {
            assertThat(vocMapper.toMemoEntity(null)).isNull();
            assertThat(vocMapper.toMemoDomain(null)).isNull();
        }

        @Test
        @DisplayName("Should correctly map internal flag for memos")
        void shouldMapInternalFlag() {
            // Internal memo
            VocMemoDomain internalMemo = VocMemoDomain.builder()
                    .authorId(1L)
                    .content("Internal note")
                    .internal(true)
                    .build();

            // Public memo
            VocMemoDomain publicMemo = VocMemoDomain.builder()
                    .authorId(1L)
                    .content("Public note")
                    .internal(false)
                    .build();

            // when
            VocMemoJpaEntity internalEntity = vocMapper.toMemoEntity(internalMemo);
            VocMemoJpaEntity publicEntity = vocMapper.toMemoEntity(publicMemo);

            // then
            assertThat(internalEntity.isInternal()).isTrue();
            assertThat(publicEntity.isInternal()).isFalse();
        }
    }

    @Nested
    @DisplayName("List Conversion Tests")
    class ListConversionTests {

        @Test
        @DisplayName("Should convert list of entities to domains")
        void shouldConvertEntityListToDomains() {
            // given
            List<VocJpaEntity> entities = List.of(
                    createTestEntity(),
                    createTestEntity()
            );

            // when
            List<VocDomain> domains = vocMapper.toDomainList(entities);

            // then
            assertThat(domains).hasSize(2);
            assertThat(domains).allMatch(d -> d.getTicketId() != null);
        }

        @Test
        @DisplayName("Should handle null list gracefully")
        void shouldHandleNullList() {
            // when
            List<VocDomain> domains = vocMapper.toDomainList(null);

            // then
            assertThat(domains).isEmpty();
        }

        @Test
        @DisplayName("Should handle empty list")
        void shouldHandleEmptyList() {
            // when
            List<VocDomain> domains = vocMapper.toDomainList(new ArrayList<>());

            // then
            assertThat(domains).isEmpty();
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle domain with null optional fields")
        void shouldHandleNullOptionalFields() {
            // given
            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-NULL-001")
                    .title("Title")
                    .content("Content")
                    .status(VocStatus.NEW)
                    .priority(VocPriority.NORMAL)
                    .categoryId(1L)
                    .customerEmail("test@test.com")
                    .customerName(null)  // optional
                    .customerPhone(null)  // optional
                    .assigneeId(null)  // optional
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);
            VocDomain restored = vocMapper.toDomain(entity);

            // then
            assertThat(restored.getCustomerName()).isNull();
            assertThat(restored.getCustomerPhone()).isNull();
            assertThat(restored.getAssigneeId()).isNull();
        }

        @Test
        @DisplayName("Should handle domain with empty string fields")
        void shouldHandleEmptyStringFields() {
            // given
            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-EMPTY-001")
                    .title("Title")
                    .content("Content")
                    .status(VocStatus.NEW)
                    .priority(VocPriority.NORMAL)
                    .categoryId(1L)
                    .customerEmail("test@test.com")
                    .customerName("")
                    .customerPhone("")
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);

            // then
            assertThat(entity.getCustomerName()).isEmpty();
            assertThat(entity.getCustomerPhone()).isEmpty();
        }

        @Test
        @DisplayName("Should handle special characters in text fields")
        void shouldHandleSpecialCharacters() {
            // given
            String specialTitle = "Test VOC with <special> & \"characters\" 'here'";
            String specialContent = "Content with\nnewlines\tand\ttabs\r\nand unicode: \u00E9\u00E8\u00EA";

            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-SPECIAL-001")
                    .title(specialTitle)
                    .content(specialContent)
                    .status(VocStatus.NEW)
                    .priority(VocPriority.NORMAL)
                    .categoryId(1L)
                    .customerEmail("test@test.com")
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);
            VocDomain restored = vocMapper.toDomain(entity);

            // then
            assertThat(restored.getTitle()).isEqualTo(specialTitle);
            assertThat(restored.getContent()).isEqualTo(specialContent);
        }

        @Test
        @DisplayName("Should handle very long text content")
        void shouldHandleLongContent() {
            // given
            String longContent = "A".repeat(10000);

            VocDomain domain = VocDomain.builder()
                    .ticketId("VOC-LONG-001")
                    .title("Long Content Test")
                    .content(longContent)
                    .status(VocStatus.NEW)
                    .priority(VocPriority.NORMAL)
                    .categoryId(1L)
                    .customerEmail("test@test.com")
                    .attachments(new ArrayList<>())
                    .memos(new ArrayList<>())
                    .build();

            // when
            VocJpaEntity entity = vocMapper.toEntity(domain);
            VocDomain restored = vocMapper.toDomain(entity);

            // then
            assertThat(restored.getContent()).hasSize(10000);
            assertThat(restored.getContent()).isEqualTo(longContent);
        }
    }

    // Helper methods

    private VocDomain createTestDomain() {
        return VocDomain.builder()
                .ticketId("VOC-2025-00001")
                .title("Test VOC Title")
                .content("Test VOC Content with details about the issue.")
                .status(VocStatus.NEW)
                .priority(VocPriority.HIGH)
                .categoryId(1L)
                .customerEmail("customer@example.com")
                .customerName("John Doe")
                .customerPhone("010-1234-5678")
                .assigneeId(100L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .memos(new ArrayList<>())
                .build();
    }

    private VocJpaEntity createTestEntity() {
        return new VocJpaEntity(
                "VOC-2025-00002",
                "Entity Test Title",
                "Entity Test Content",
                VocStatus.IN_PROGRESS,
                VocPriority.NORMAL,
                2L,
                "entity@example.com",
                "Jane Smith",
                "010-9876-5432",
                200L
        );
    }
}
