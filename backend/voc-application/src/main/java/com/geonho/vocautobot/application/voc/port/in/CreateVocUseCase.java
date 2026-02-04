package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.CreateVocCommand;
import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Use case for creating a new VOC
 */
public interface CreateVocUseCase {

    VocDomain createVoc(CreateVocCommand command);
}
