package com.geonho.vocautobot.application.voc.usecase;

import com.geonho.vocautobot.application.analysis.port.out.ProgressiveLearningPort;
import com.geonho.vocautobot.application.notification.port.out.NotificationPort;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.voc.exception.VocNotFoundException;
import com.geonho.vocautobot.application.voc.port.in.dto.ChangeStatusCommand;
import com.geonho.vocautobot.application.voc.port.out.GenerateTicketIdPort;
import com.geonho.vocautobot.application.voc.port.out.LoadStatusHistoryPort;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveStatusHistoryPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import com.geonho.vocautobot.domain.voc.VocStatusHistory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VocServiceStatusHistoryTest {

    @Mock
    private LoadVocPort loadVocPort;

    @Mock
    private SaveVocPort saveVocPort;

    @Mock
    private GenerateTicketIdPort generateTicketIdPort;

    @Mock
    private LoadUserPort loadUserPort;

    @Mock
    private NotificationPort notificationPort;

    @Mock
    private ProgressiveLearningPort progressiveLearningPort;

    @Mock
    private SaveStatusHistoryPort saveStatusHistoryPort;

    @Mock
    private LoadStatusHistoryPort loadStatusHistoryPort;

    @InjectMocks
    private VocService vocService;

    private VocDomain testVoc;

    @BeforeEach
    void setUp() {
        testVoc = VocDomain.builder()
                .id(1L)
                .ticketId("VOC-001")
                .title("Test VOC")
                .content("Test Content")
                .status(VocStatus.NEW)
                .categoryId(1L)
                .customerEmail("test@test.com")
                .customerName("Test Customer")
                .priority(VocPriority.NORMAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("상태 변경 시 이력이 저장되어야 함")
    void changeStatus_shouldSaveHistory() {
        // given
        ChangeStatusCommand command = new ChangeStatusCommand(1L, VocStatus.IN_PROGRESS, "처리 시작");

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(saveVocPort.saveVoc(any(VocDomain.class))).thenReturn(testVoc);

        // when
        vocService.changeStatus(command);

        // then
        ArgumentCaptor<VocStatusHistory> historyCaptor = ArgumentCaptor.forClass(VocStatusHistory.class);
        verify(saveStatusHistoryPort, times(1)).saveStatusHistory(historyCaptor.capture());

        VocStatusHistory savedHistory = historyCaptor.getValue();
        assertThat(savedHistory.getVocId()).isEqualTo(1L);
        assertThat(savedHistory.getPreviousStatus()).isEqualTo(VocStatus.NEW);
        assertThat(savedHistory.getNewStatus()).isEqualTo(VocStatus.IN_PROGRESS);
        assertThat(savedHistory.getChangeReason()).isEqualTo("처리 시작");
        assertThat(savedHistory.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("상태 변경 이력 조회 시 VOC가 존재해야 함")
    void getStatusHistory_shouldThrowWhenVocNotFound() {
        // given
        when(loadVocPort.loadVocById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> vocService.getStatusHistory(999L))
                .isInstanceOf(VocNotFoundException.class);
    }

    @Test
    @DisplayName("상태 변경 이력이 정상적으로 조회되어야 함")
    void getStatusHistory_shouldReturnHistory() {
        // given
        VocStatusHistory history1 = VocStatusHistory.create(
                1L, VocStatus.NEW, VocStatus.IN_PROGRESS, null, "처리 시작"
        );
        VocStatusHistory history2 = VocStatusHistory.create(
                1L, VocStatus.IN_PROGRESS, VocStatus.RESOLVED, null, "해결 완료"
        );

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(loadStatusHistoryPort.loadStatusHistoryByVocId(1L))
                .thenReturn(List.of(history1, history2));

        // when
        List<VocStatusHistory> result = vocService.getStatusHistory(1L);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getNewStatus()).isEqualTo(VocStatus.IN_PROGRESS);
        assertThat(result.get(1).getNewStatus()).isEqualTo(VocStatus.RESOLVED);
    }

    @Test
    @DisplayName("처리 노트 없이 상태 변경 시에도 이력이 저장되어야 함")
    void changeStatus_withoutProcessingNote_shouldSaveHistory() {
        // given
        ChangeStatusCommand command = new ChangeStatusCommand(1L, VocStatus.IN_PROGRESS);

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(saveVocPort.saveVoc(any(VocDomain.class))).thenReturn(testVoc);

        // when
        vocService.changeStatus(command);

        // then
        ArgumentCaptor<VocStatusHistory> historyCaptor = ArgumentCaptor.forClass(VocStatusHistory.class);
        verify(saveStatusHistoryPort, times(1)).saveStatusHistory(historyCaptor.capture());

        VocStatusHistory savedHistory = historyCaptor.getValue();
        assertThat(savedHistory.getChangeReason()).isNull();
    }
}
