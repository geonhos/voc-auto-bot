package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.ChangeStatusCommand;
import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Use case for changing VOC status
 */
public interface ChangeVocStatusUseCase {

    Voc changeStatus(ChangeStatusCommand command);
}
