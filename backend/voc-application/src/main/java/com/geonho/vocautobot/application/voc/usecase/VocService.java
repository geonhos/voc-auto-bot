package com.geonho.vocautobot.application.voc.usecase;

import com.geonho.vocautobot.application.notification.port.out.NotificationPort;
import com.geonho.vocautobot.application.user.port.out.LoadUserPort;
import com.geonho.vocautobot.application.voc.exception.TicketIdGenerationException;
import com.geonho.vocautobot.application.voc.exception.VocAccessDeniedException;
import com.geonho.vocautobot.application.voc.exception.VocNotFoundException;
import com.geonho.vocautobot.application.voc.port.in.*;
import com.geonho.vocautobot.application.voc.port.in.dto.*;
import com.geonho.vocautobot.application.voc.port.out.GenerateTicketIdPort;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import com.geonho.vocautobot.domain.voc.VocConstants;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocMemoDomain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service implementing all VOC-related use cases
 * Follows Hexagonal Architecture pattern
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VocService implements
        CreateVocUseCase,
        UpdateVocUseCase,
        ChangeVocStatusUseCase,
        AssignVocUseCase,
        GetVocListUseCase,
        GetVocDetailUseCase,
        AddMemoUseCase {

    private final LoadVocPort loadVocPort;
    private final SaveVocPort saveVocPort;
    private final GenerateTicketIdPort generateTicketIdPort;
    private final LoadUserPort loadUserPort;
    private final NotificationPort notificationPort;

    @Override
    @Transactional
    public VocDomain createVoc(CreateVocCommand command) {
        // Generate unique ticket ID with retry limit
        String ticketId = generateUniqueTicketId();

        // Create VOC domain model using factory method
        VocDomain voc = VocDomain.create(
                ticketId,
                command.title(),
                command.content(),
                command.categoryId(),
                command.customerEmail(),
                command.customerName(),
                command.customerPhone(),
                command.priority()
        );

        VocDomain savedVoc = saveVocPort.saveVoc(voc);

        // Send notification (non-blocking - failures should not affect VOC creation)
        sendNotificationSafely(() -> notificationPort.notifyVocCreated(savedVoc),
                "VOC created notification", savedVoc.getTicketId());

        return savedVoc;
    }

    @Override
    @Transactional
    public VocDomain updateVoc(UpdateVocCommand command) {
        VocDomain voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Update basic information
        voc.updateInfo(command.title(), command.content());

        // Update priority if provided
        if (command.priority() != null) {
            voc.updatePriority(command.priority());
        }

        // Update category if provided
        if (command.categoryId() != null) {
            voc.updateCategory(command.categoryId());
        }

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public VocDomain changeStatus(ChangeStatusCommand command) {
        VocDomain voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Store previous status for notification
        String previousStatus = voc.getStatus().name();

        // Change status (domain logic validates state transition)
        voc.updateStatus(command.newStatus());

        VocDomain savedVoc = saveVocPort.saveVoc(voc);

        // Send notification (non-blocking - failures should not affect status change)
        sendNotificationSafely(() -> notificationPort.notifyVocStatusChanged(savedVoc, previousStatus),
                "VOC status change notification", savedVoc.getTicketId());

        return savedVoc;
    }

    @Override
    @Transactional
    public VocDomain assignVoc(AssignVocCommand command) {
        VocDomain voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Load assignee user
        User assignee = loadUserPort.loadById(command.assigneeId())
                .orElseThrow(() -> new VocAccessDeniedException(
                        String.format("사용자(ID: %d)를 찾을 수 없습니다.", command.assigneeId())
                ));

        // Assign to user (domain logic handles status change if needed)
        voc.assign(command.assigneeId());

        VocDomain savedVoc = saveVocPort.saveVoc(voc);

        // Send notification (non-blocking - failures should not affect assignment)
        sendNotificationSafely(() -> notificationPort.notifyVocAssigned(savedVoc, assignee.getUsername()),
                "VOC assignment notification", savedVoc.getTicketId());

        return savedVoc;
    }

    @Override
    @Transactional
    public VocDomain unassignVoc(Long vocId) {
        VocDomain voc = loadVocPort.loadVocById(vocId)
                .orElseThrow(() -> new VocNotFoundException(vocId));

        // Unassign from user
        voc.unassign();

        return saveVocPort.saveVoc(voc);
    }

    @Override
    public Page<VocDomain> getVocList(VocListQuery query) {
        return loadVocPort.loadVocList(
                query.status(),
                query.priority(),
                query.categoryId(),
                query.assigneeId(),
                query.customerEmail(),
                query.search(),
                query.toPageable()
        );
    }

    @Override
    public VocDomain getVocById(Long id) {
        return loadVocPort.loadVocById(id)
                .orElseThrow(() -> new VocNotFoundException(id));
    }

    @Override
    public VocDomain getVocByTicketId(String ticketId) {
        return loadVocPort.loadVocByTicketId(ticketId)
                .orElseThrow(() -> new VocNotFoundException(ticketId));
    }

    @Override
    public Optional<VocDomain> getVocByTicketIdAndEmail(String ticketId, String email) {
        return loadVocPort.loadVocByTicketIdAndEmail(ticketId, email);
    }

    @Override
    @Transactional
    public VocDomain addMemo(AddMemoCommand command, Long requestingUserId) {
        VocDomain voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Verify access control
        validateVocAccess(voc, requestingUserId);

        // Create and add memo using domain factory method
        VocMemoDomain memo = VocMemoDomain.create(
                command.authorId(),
                command.content(),
                command.internal()
        );

        voc.addMemo(memo);

        return saveVocPort.saveVoc(voc);
    }

    /**
     * Generate a unique ticket ID with retry limit to prevent infinite loop
     * @return unique ticket ID
     * @throws TicketIdGenerationException if max retries exceeded
     */
    private String generateUniqueTicketId() {
        for (int attempt = 0; attempt < VocConstants.MAX_TICKET_ID_RETRIES; attempt++) {
            String ticketId = generateTicketIdPort.generateTicketId();
            if (!loadVocPort.existsByTicketId(ticketId)) {
                return ticketId;
            }
        }
        throw new TicketIdGenerationException(VocConstants.MAX_TICKET_ID_RETRIES);
    }

    /**
     * Validate if the user has access to the VOC
     * - ADMIN and MANAGER: can access all VOCs
     * - OPERATOR: can only access VOCs assigned to them
     *
     * @param voc VOC domain model to check access for
     * @param userId ID of the user requesting access
     * @throws VocAccessDeniedException if user has no access to the VOC
     */
    private void validateVocAccess(VocDomain voc, Long userId) {
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new VocAccessDeniedException(
                        String.format("사용자(ID: %d)를 찾을 수 없습니다.", userId)
                ));

        // ADMIN and MANAGER have access to all VOCs
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER) {
            return;
        }

        // OPERATOR can only access VOCs assigned to them
        if (user.getRole() == UserRole.OPERATOR) {
            if (voc.getAssigneeId() == null || !voc.getAssigneeId().equals(userId)) {
                throw new VocAccessDeniedException(voc.getId(), userId);
            }
        }
    }

    /**
     * Send notification safely without affecting the main business operation.
     * Notification failures are logged but do not propagate exceptions.
     *
     * @param notificationAction the notification action to execute
     * @param notificationType description of the notification type for logging
     * @param identifier VOC identifier for logging
     */
    private void sendNotificationSafely(Runnable notificationAction, String notificationType, String identifier) {
        try {
            notificationAction.run();
        } catch (Exception e) {
            log.warn("Failed to send {} for VOC [{}]: {}", notificationType, identifier, e.getMessage());
        }
    }
}
