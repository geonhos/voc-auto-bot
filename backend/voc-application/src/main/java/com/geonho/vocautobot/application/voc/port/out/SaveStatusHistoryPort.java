package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.VocStatusHistory;

public interface SaveStatusHistoryPort {
    void saveStatusHistory(VocStatusHistory history);
}
