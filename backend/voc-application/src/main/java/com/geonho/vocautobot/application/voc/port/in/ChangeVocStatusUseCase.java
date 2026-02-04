package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.ChangeStatusCommand;
import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Use case for changing VOC status
 */
public interface ChangeVocStatusUseCase {

    VocDomain changeStatus(ChangeStatusCommand command);
}
