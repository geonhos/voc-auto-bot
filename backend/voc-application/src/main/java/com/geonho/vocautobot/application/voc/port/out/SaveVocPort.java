package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.Voc;

/**
 * Output port for saving VOC entities to persistence
 */
public interface SaveVocPort {

    Voc saveVoc(Voc voc);

    void deleteVoc(Long id);
}
