package com.geonho.vocautobot.application.voc.usecase;

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
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocMemo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementing all VOC-related use cases
 * Follows Hexagonal Architecture pattern
 */
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

    private static final int MAX_TICKET_ID_RETRIES = 10;

    private final LoadVocPort loadVocPort;
    private final SaveVocPort saveVocPort;
    private final GenerateTicketIdPort generateTicketIdPort;
    private final LoadUserPort loadUserPort;

    @Override
    @Transactional
    public Voc createVoc(CreateVocCommand command) {
        // Generate unique ticket ID with retry limit
        String ticketId = generateUniqueTicketId();

        // Create VOC entity
        Voc voc = Voc.builder()
                .ticketId(ticketId)
                .title(command.title())
                .content(command.content())
                .categoryId(command.categoryId())
                .customerEmail(command.customerEmail())
                .customerName(command.customerName())
                .customerPhone(command.customerPhone())
                .priority(command.priority())
                .build();

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc updateVoc(UpdateVocCommand command) {
        Voc voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Update basic information
        voc.updateInfo(command.title(), command.content());

        // Update priority if provided
        if (command.priority() != null) {
            voc.updatePriority(command.priority());
        }

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc changeStatus(ChangeStatusCommand command) {
        Voc voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Change status (domain logic validates state transition)
        voc.updateStatus(command.newStatus());

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc assignVoc(AssignVocCommand command) {
        Voc voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Assign to user (domain logic handles status change if needed)
        voc.assign(command.assigneeId());

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc unassignVoc(Long vocId) {
        Voc voc = loadVocPort.loadVocById(vocId)
                .orElseThrow(() -> new VocNotFoundException(vocId));

        // Unassign from user
        voc.unassign();

        return saveVocPort.saveVoc(voc);
    }

    @Override
    public Page<Voc> getVocList(VocListQuery query) {
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
    public Voc getVocById(Long id) {
        return loadVocPort.loadVocById(id)
                .orElseThrow(() -> new VocNotFoundException(id));
    }

    @Override
    public Voc getVocByTicketId(String ticketId) {
        return loadVocPort.loadVocByTicketId(ticketId)
                .orElseThrow(() -> new VocNotFoundException(ticketId));
    }

    @Override
    @Transactional
    public Voc addMemo(AddMemoCommand command, Long requestingUserId) {
        Voc voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new VocNotFoundException(command.vocId()));

        // Verify access control
        validateVocAccess(voc, requestingUserId);

        // Create and add memo
        VocMemo memo = VocMemo.builder()
                .content(command.content())
                .internal(command.internal())
                .authorId(command.authorId())
                .build();

        voc.addMemo(memo);

        return saveVocPort.saveVoc(voc);
    }

    /**
     * Generate a unique ticket ID with retry limit to prevent infinite loop
     * @return unique ticket ID
     * @throws TicketIdGenerationException if max retries exceeded
     */
    private String generateUniqueTicketId() {
        for (int attempt = 0; attempt < MAX_TICKET_ID_RETRIES; attempt++) {
            String ticketId = generateTicketIdPort.generateTicketId();
            if (!loadVocPort.existsByTicketId(ticketId)) {
                return ticketId;
            }
        }
        throw new TicketIdGenerationException(MAX_TICKET_ID_RETRIES);
    }

    /**
     * Validate if the user has access to the VOC
     * - ADMIN and MANAGER: can access all VOCs
     * - OPERATOR: can only access VOCs assigned to them
     *
     * @param voc VOC to check access for
     * @param userId ID of the user requesting access
     * @throws VocAccessDeniedException if user has no access to the VOC
     */
    private void validateVocAccess(Voc voc, Long userId) {
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
}
