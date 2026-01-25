package com.geonho.vocautobot.application.voc.usecase;

import com.geonho.vocautobot.application.voc.port.in.*;
import com.geonho.vocautobot.application.voc.port.in.dto.*;
import com.geonho.vocautobot.application.voc.port.out.GenerateTicketIdPort;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.voc.Voc;
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
        GetVocDetailUseCase {

    private final LoadVocPort loadVocPort;
    private final SaveVocPort saveVocPort;
    private final GenerateTicketIdPort generateTicketIdPort;

    @Override
    @Transactional
    public Voc createVoc(CreateVocCommand command) {
        // Generate unique ticket ID
        String ticketId = generateTicketIdPort.generateTicketId();

        // Ensure ticket ID is unique
        while (loadVocPort.existsByTicketId(ticketId)) {
            ticketId = generateTicketIdPort.generateTicketId();
        }

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
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + command.vocId()));

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
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + command.vocId()));

        // Change status (domain logic validates state transition)
        voc.updateStatus(command.newStatus());

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc assignVoc(AssignVocCommand command) {
        Voc voc = loadVocPort.loadVocById(command.vocId())
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + command.vocId()));

        // Assign to user (domain logic handles status change if needed)
        voc.assign(command.assigneeId());

        return saveVocPort.saveVoc(voc);
    }

    @Override
    @Transactional
    public Voc unassignVoc(Long vocId) {
        Voc voc = loadVocPort.loadVocById(vocId)
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + vocId));

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
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + id));
    }

    @Override
    public Voc getVocByTicketId(String ticketId) {
        return loadVocPort.loadVocByTicketId(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("VOC를 찾을 수 없습니다: " + ticketId));
    }
}
