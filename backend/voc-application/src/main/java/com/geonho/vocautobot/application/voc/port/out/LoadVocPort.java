package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Output port for loading VOC entities from persistence
 */
public interface LoadVocPort {

    Optional<Voc> loadVocById(Long id);

    Optional<Voc> loadVocByTicketId(String ticketId);

    Page<Voc> loadVocList(
            VocStatus status,
            VocPriority priority,
            Long categoryId,
            Long assigneeId,
            String customerEmail,
            String search,
            Pageable pageable
    );

    boolean existsByTicketId(String ticketId);
}
