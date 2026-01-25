package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.application.voc.port.out.GenerateTicketIdPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class TicketIdGeneratorAdapter implements GenerateTicketIdPort {

    private static final String TICKET_ID_PREFIX = "VOC";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int SEQUENCE_LENGTH = 5;

    private final VocJpaRepository vocJpaRepository;

    @Override
    @Transactional
    public String generateTicketId() {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DATE_FORMATTER);

        long count = vocJpaRepository.countByCreatedDate(today);
        long sequence = count + 1;

        String sequenceStr = String.format("%0" + SEQUENCE_LENGTH + "d", sequence);
        String ticketId = String.format("%s-%s-%s", TICKET_ID_PREFIX, dateStr, sequenceStr);

        while (vocJpaRepository.existsByTicketId(ticketId)) {
            sequence++;
            sequenceStr = String.format("%0" + SEQUENCE_LENGTH + "d", sequence);
            ticketId = String.format("%s-%s-%s", TICKET_ID_PREFIX, dateStr, sequenceStr);
        }

        return ticketId;
    }
}
