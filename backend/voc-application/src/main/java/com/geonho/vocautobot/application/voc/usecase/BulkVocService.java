package com.geonho.vocautobot.application.voc.usecase;

import com.geonho.vocautobot.application.voc.port.in.BulkVocUseCase;
import com.geonho.vocautobot.application.voc.port.in.dto.BulkAssignCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.BulkPriorityChangeCommand;
import com.geonho.vocautobot.application.voc.port.in.dto.BulkStatusChangeCommand;
import com.geonho.vocautobot.application.voc.port.out.LoadVocPort;
import com.geonho.vocautobot.application.voc.port.out.SaveVocPort;
import com.geonho.vocautobot.domain.voc.BulkOperationResult;
import com.geonho.vocautobot.domain.voc.VocDomain;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service implementing bulk VOC operations.
 * Supports partial failure - each VOC is processed individually,
 * and failures on one VOC do not prevent others from being processed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BulkVocService implements BulkVocUseCase {

    private final LoadVocPort loadVocPort;
    private final SaveVocPort saveVocPort;

    @Override
    @Transactional
    public BulkOperationResult bulkChangeStatus(BulkStatusChangeCommand command) {
        List<VocDomain> vocs = loadVocPort.loadVocsByIds(command.vocIds());
        Map<Long, VocDomain> vocMap = buildVocMap(vocs);

        int successCount = 0;
        List<Long> failedIds = new ArrayList<>();
        Map<Long, String> errors = new LinkedHashMap<>();

        for (Long vocId : command.vocIds()) {
            VocDomain voc = vocMap.get(vocId);
            if (voc == null) {
                failedIds.add(vocId);
                errors.put(vocId, "VOC를 찾을 수 없습니다");
                continue;
            }
            try {
                voc.updateStatus(command.status());
                saveVocPort.saveVoc(voc);
                successCount++;
            } catch (IllegalStateException e) {
                failedIds.add(vocId);
                errors.put(vocId, e.getMessage());
            }
        }

        log.info("Bulk status change completed: {} succeeded, {} failed out of {} total",
                successCount, failedIds.size(), command.vocIds().size());

        return new BulkOperationResult(successCount, failedIds, errors);
    }

    @Override
    @Transactional
    public BulkOperationResult bulkAssign(BulkAssignCommand command) {
        List<VocDomain> vocs = loadVocPort.loadVocsByIds(command.vocIds());
        Map<Long, VocDomain> vocMap = buildVocMap(vocs);

        int successCount = 0;
        List<Long> failedIds = new ArrayList<>();
        Map<Long, String> errors = new LinkedHashMap<>();

        for (Long vocId : command.vocIds()) {
            VocDomain voc = vocMap.get(vocId);
            if (voc == null) {
                failedIds.add(vocId);
                errors.put(vocId, "VOC를 찾을 수 없습니다");
                continue;
            }
            try {
                voc.assign(command.assigneeId());
                saveVocPort.saveVoc(voc);
                successCount++;
            } catch (Exception e) {
                failedIds.add(vocId);
                errors.put(vocId, e.getMessage());
            }
        }

        log.info("Bulk assign completed: {} succeeded, {} failed out of {} total",
                successCount, failedIds.size(), command.vocIds().size());

        return new BulkOperationResult(successCount, failedIds, errors);
    }

    @Override
    @Transactional
    public BulkOperationResult bulkChangePriority(BulkPriorityChangeCommand command) {
        List<VocDomain> vocs = loadVocPort.loadVocsByIds(command.vocIds());
        Map<Long, VocDomain> vocMap = buildVocMap(vocs);

        int successCount = 0;
        List<Long> failedIds = new ArrayList<>();
        Map<Long, String> errors = new LinkedHashMap<>();

        for (Long vocId : command.vocIds()) {
            VocDomain voc = vocMap.get(vocId);
            if (voc == null) {
                failedIds.add(vocId);
                errors.put(vocId, "VOC를 찾을 수 없습니다");
                continue;
            }
            try {
                voc.updatePriority(command.priority());
                saveVocPort.saveVoc(voc);
                successCount++;
            } catch (Exception e) {
                failedIds.add(vocId);
                errors.put(vocId, e.getMessage());
            }
        }

        log.info("Bulk priority change completed: {} succeeded, {} failed out of {} total",
                successCount, failedIds.size(), command.vocIds().size());

        return new BulkOperationResult(successCount, failedIds, errors);
    }

    private Map<Long, VocDomain> buildVocMap(List<VocDomain> vocs) {
        Map<Long, VocDomain> map = new HashMap<>();
        for (VocDomain voc : vocs) {
            map.put(voc.getId(), voc);
        }
        return map;
    }
}
