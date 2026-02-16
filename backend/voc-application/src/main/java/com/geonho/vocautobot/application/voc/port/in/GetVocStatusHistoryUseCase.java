package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.domain.voc.VocStatusHistory;

import java.util.List;

public interface GetVocStatusHistoryUseCase {
    List<VocStatusHistory> getStatusHistory(Long vocId);
}
