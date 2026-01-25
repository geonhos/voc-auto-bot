package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.application.voc.port.in.dto.VocListQuery;
import com.geonho.vocautobot.domain.voc.Voc;
import org.springframework.data.domain.Page;

/**
 * Use case for retrieving VOC list
 */
public interface GetVocListUseCase {

    Page<Voc> getVocList(VocListQuery query);
}
