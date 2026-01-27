package com.geonho.vocautobot.adapter.in.web.voc;

import com.geonho.vocautobot.adapter.in.web.voc.dto.*;
import com.geonho.vocautobot.application.voc.port.in.*;
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.adapter.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * VOC management REST controller
 */
@Tag(name = "VOC", description = "VOC 관리 API (인증 필요)")
@RestController
@RequestMapping("/v1/vocs")
@RequiredArgsConstructor
public class VocController {

    private final CreateVocUseCase createVocUseCase;
    private final UpdateVocUseCase updateVocUseCase;
    private final GetVocListUseCase getVocListUseCase;
    private final GetVocDetailUseCase getVocDetailUseCase;
    private final ChangeVocStatusUseCase changeVocStatusUseCase;
    private final AssignVocUseCase assignVocUseCase;

    @Operation(summary = "VOC 생성", description = "새로운 VOC를 생성합니다")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VocResponse> createVoc(@Valid @RequestBody CreateVocRequest request) {
        Voc voc = createVocUseCase.createVoc(request.toCommand());
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 목록 조회", description = "필터링과 페이징을 적용한 VOC 목록을 조회합니다")
    @GetMapping
    public ApiResponse<VocListResponse> getVocs(
            @Parameter(description = "상태") @RequestParam(required = false) String status,
            @Parameter(description = "우선순위") @RequestParam(required = false) String priority,
            @Parameter(description = "카테고리 ID") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "담당자 ID") @RequestParam(required = false) Long assigneeId,
            @Parameter(description = "고객 이메일") @RequestParam(required = false) String customerEmail,
            @Parameter(description = "검색 키워드") @RequestParam(required = false) String search,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "정렬 필드") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향") @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        VocSearchFilter filter = new VocSearchFilter();
        if (status != null) {
            filter.setStatus(com.geonho.vocautobot.domain.voc.VocStatus.valueOf(status));
        }
        if (priority != null) {
            filter.setPriority(com.geonho.vocautobot.domain.voc.VocPriority.valueOf(priority));
        }
        filter.setCategoryId(categoryId);
        filter.setAssigneeId(assigneeId);
        filter.setCustomerEmail(customerEmail);
        filter.setSearch(search);
        filter.setPage(page);
        filter.setSize(size);
        filter.setSortBy(sortBy);
        filter.setSortDirection(sortDirection);

        Page<Voc> vocPage = getVocListUseCase.getVocList(filter.toQuery());
        VocListResponse response = VocListResponse.from(vocPage);

        return ApiResponse.success(
                response,
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages()
        );
    }

    @Operation(summary = "VOC 상세 조회", description = "ID로 VOC 상세 정보를 조회합니다")
    @GetMapping("/{id}")
    public ApiResponse<VocResponse> getVoc(@PathVariable Long id) {
        Voc voc = getVocDetailUseCase.getVocById(id);
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 수정", description = "VOC 정보를 수정합니다")
    @PutMapping("/{id}")
    public ApiResponse<VocResponse> updateVoc(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVocRequest request
    ) {
        Voc voc = updateVocUseCase.updateVoc(request.toCommand(id));
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 상태 변경", description = "VOC의 상태를 변경합니다")
    @PatchMapping("/{id}/status")
    public ApiResponse<VocResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeStatusRequest request
    ) {
        Voc voc = changeVocStatusUseCase.changeStatus(request.toCommand(id));
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 담당자 배정", description = "VOC에 담당자를 배정합니다")
    @PatchMapping("/{id}/assign")
    public ApiResponse<VocResponse> assignVoc(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request
    ) {
        Voc voc = assignVocUseCase.assignVoc(request.toCommand(id));
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 담당자 해제", description = "VOC의 담당자 배정을 해제합니다")
    @PatchMapping("/{id}/unassign")
    public ApiResponse<VocResponse> unassignVoc(@PathVariable Long id) {
        Voc voc = assignVocUseCase.unassignVoc(id);
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "유사 VOC 조회",
            description = "현재 VOC와 유사한 VOC 목록을 조회합니다 (향후 구현 예정)"
    )
    @GetMapping("/{id}/similar")
    public ApiResponse<List<VocResponse>> getSimilarVocs(@PathVariable Long id) {
        // TODO: Implement similar VOC search using AI/ML service
        // This will be implemented in future sprints
        return ApiResponse.success(List.of());
    }

    @Operation(
            summary = "상태 변경 이력 조회",
            description = "VOC의 상태 변경 이력을 조회합니다 (향후 구현 예정)"
    )
    @GetMapping("/{id}/history")
    public ApiResponse<List<Object>> getVocHistory(@PathVariable Long id) {
        // TODO: Implement VOC status change history
        // This requires VocStatusHistory entity and repository
        return ApiResponse.success(List.of());
    }
}
