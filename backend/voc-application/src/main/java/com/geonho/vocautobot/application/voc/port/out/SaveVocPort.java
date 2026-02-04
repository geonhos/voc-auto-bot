package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.VocDomain;

/**
 * Output port for saving VOC domain models to persistence.
 * This port accepts and returns pure domain models without any JPA dependencies.
 */
public interface SaveVocPort {

    VocDomain saveVoc(VocDomain voc);

    void deleteVoc(Long id);
}
