package com.geonho.vocautobot.application.voc.usecase;

import com.geonho.vocautobot.application.notification.port.out.NotificationPort;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.voc.port.in.dto.AssignVocCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.ChangeStatusCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.CreateVocCommand;
import com.geonho.vocautobot.application.voc.port.out.GenerateTicketIdPort;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for VocService Slack notification integration
 */
@ExtendWith(MockitoExtension.class)
class VocServiceSlackNotificationTest {

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

    @InjectMocks
    private VocService vocService;

    private Voc testVoc;
    private User testUser;

    @BeforeEach
    void setUp() {
        testVoc = Voc.builder()
                .id(1L)
                .ticketId("VOC-001")
                .title("Test VOC")
                .content("Test Content")
                .categoryId(1L)
                .customerEmail("test@test.com")
                .customerName("Test Customer")
                .priority(VocPriority.NORMAL)
                .build();

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("testuser@test.com")
                .role(UserRole.OPERATOR)
                .build();
    }

    @Test
    @DisplayName("VOC 생성 시 Slack 알림이 전송되어야 함")
    void createVoc_shouldSendNotification() {
        // given
        CreateVocCommand command = new CreateVocCommand(
                "Test VOC",
                "Test Content",
                1L,
                "customer@test.com",
                "Customer Name",
                "010-1234-5678",
                VocPriority.NORMAL
        );

        when(generateTicketIdPort.generateTicketId()).thenReturn("VOC-001");
        when(loadVocPort.existsByTicketId("VOC-001")).thenReturn(false);
        when(saveVocPort.saveVoc(any(Voc.class))).thenReturn(testVoc);

        // when
        vocService.createVoc(command);

        // then
        verify(notificationPort, times(1)).notifyVocCreated(any(Voc.class));
    }

    @Test
    @DisplayName("VOC 상태 변경 시 Slack 알림이 전송되어야 함")
    void changeStatus_shouldSendNotification() {
        // given
        ChangeStatusCommand command = new ChangeStatusCommand(1L, VocStatus.IN_PROGRESS);

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(saveVocPort.saveVoc(any(Voc.class))).thenReturn(testVoc);

        // when
        vocService.changeStatus(command);

        // then
        ArgumentCaptor<String> statusCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationPort, times(1)).notifyVocStatusChanged(
                any(Voc.class),
                statusCaptor.capture()
        );
        assertThat(statusCaptor.getValue()).isEqualTo("NEW");
    }

    @Test
    @DisplayName("VOC 할당 시 Slack 알림이 전송되어야 함")
    void assignVoc_shouldSendNotification() {
        // given
        AssignVocCommand command = new AssignVocCommand(1L, 1L);

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(loadUserPort.loadById(1L)).thenReturn(Optional.of(testUser));
        when(saveVocPort.saveVoc(any(Voc.class))).thenReturn(testVoc);

        // when
        vocService.assignVoc(command);

        // then
        ArgumentCaptor<String> nameCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationPort, times(1)).notifyVocAssigned(
                any(Voc.class),
                nameCaptor.capture()
        );
        assertThat(nameCaptor.getValue()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("알림 전송 실패 시에도 VOC 생성은 정상 처리되어야 함")
    void createVoc_whenNotificationFails_shouldStillSucceed() {
        // given
        CreateVocCommand command = new CreateVocCommand(
                "Test VOC",
                "Test Content",
                1L,
                "customer@test.com",
                "Customer Name",
                "010-1234-5678",
                VocPriority.NORMAL
        );

        when(generateTicketIdPort.generateTicketId()).thenReturn("VOC-001");
        when(loadVocPort.existsByTicketId("VOC-001")).thenReturn(false);
        when(saveVocPort.saveVoc(any(Voc.class))).thenReturn(testVoc);

        // Notification fails
        doThrow(new RuntimeException("Slack API Error"))
                .when(notificationPort).notifyVocCreated(any(Voc.class));

        // when
        Voc result = vocService.createVoc(command);

        // then
        assertThat(result).isNotNull();
        verify(saveVocPort, times(1)).saveVoc(any(Voc.class));
    }

    @Test
    @DisplayName("알림 전송 실패 시에도 VOC 상태 변경은 정상 처리되어야 함")
    void changeStatus_whenNotificationFails_shouldStillSucceed() {
        // given
        ChangeStatusCommand command = new ChangeStatusCommand(1L, VocStatus.IN_PROGRESS);

        when(loadVocPort.loadVocById(1L)).thenReturn(Optional.of(testVoc));
        when(saveVocPort.saveVoc(any(Voc.class))).thenReturn(testVoc);

        // Notification fails
        doThrow(new RuntimeException("Slack API Error"))
                .when(notificationPort).notifyVocStatusChanged(any(Voc.class), anyString());

        // when
        Voc result = vocService.changeStatus(command);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(VocStatus.IN_PROGRESS);
        verify(saveVocPort, times(1)).saveVoc(any(Voc.class));
    }
}
