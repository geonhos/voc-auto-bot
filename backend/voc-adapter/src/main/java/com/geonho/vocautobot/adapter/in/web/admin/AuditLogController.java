package com.geonho.vocautobot.adapter.in.web.admin;

import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.web.admin.dto.AuditLogResponse;
import com.geonho.vocautobot.application.audit.port.in.GetAuditLogsUseCase;
import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Audit Log", description = "감사 로그 관리 API")
@RestController
@RequestMapping("/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final GetAuditLogsUseCase getAuditLogsUseCase;

    @Operation(summary = "감사 로그 조회", description = "필터 조건으로 감사 로그를 조회합니다")
    @GetMapping
    public ApiResponse<List<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditEntityType entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<AuditLog> auditLogs = getAuditLogsUseCase.getAuditLogs(
                userId, action, entityType, entityId, startDate, endDate, pageable
        );

        List<AuditLogResponse> content = auditLogs.getContent().stream()
                .map(AuditLogResponse::from)
                .toList();

        return ApiResponse.success(
                content,
                auditLogs.getNumber(),
                auditLogs.getSize(),
                auditLogs.getTotalElements(),
                auditLogs.getTotalPages()
        );
    }
}
