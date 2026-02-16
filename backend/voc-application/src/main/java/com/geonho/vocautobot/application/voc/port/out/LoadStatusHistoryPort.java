package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.VocStatusHistory;

import java.util.List;

public interface LoadStatusHistoryPort {
    List<VocStatusHistory> loadStatusHistoryByVocId(Long vocId);
}
