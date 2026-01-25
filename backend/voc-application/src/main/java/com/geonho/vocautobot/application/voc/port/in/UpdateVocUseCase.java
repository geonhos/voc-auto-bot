package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.UpdateVocCommand;
import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Use case for updating VOC information
 */
public interface UpdateVocUseCase {

    Voc updateVoc(UpdateVocCommand command);
}
