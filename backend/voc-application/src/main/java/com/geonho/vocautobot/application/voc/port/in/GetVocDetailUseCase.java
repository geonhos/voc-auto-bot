package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Use case for retrieving VOC detail
 */
public interface GetVocDetailUseCase {

    Voc getVocById(Long id);

    Voc getVocByTicketId(String ticketId);
}
