package com.geonho.vocautobot.adapter.in.web.voc;

import com.geonho.vocautobot.adapter.in.security.SecurityUser;
import com.geonho.vocautobot.adapter.in.web.voc.dto.*;
import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import com.geonho.vocautobot.application.analysis.port.out.SentimentAnalysisPort;
import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort;
import com.geonho.vocautobot.application.analysis.service.AsyncVocAnalysisService;
import com.geonho.vocautobot.application.notification.usecase.NotificationService;
import com.geonho.vocautobot.application.voc.port.out.UpdateVocSentimentPort;
import com.geonho.vocautobot.domain.notification.NotificationType;
import com.geonho.vocautobot.application.category.port.in.SuggestCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.dto.CategorySuggestionResult;
import com.geonho.vocautobot.application.voc.port.in.*;
import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.adapter.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * VOC management REST controller
 */
@Tag(name = "VOC", description = "VOC 관리 API (인증 필요)")
@RestController
@RequestMapping("/v1/vocs")
public class VocController {

    private static final Logger log = LoggerFactory.getLogger(VocController.class);
    private static final Long DEV_DEFAULT_USER_ID = 1L;

    @Value("${security.enabled:true}")
    private boolean securityEnabled;

    private final CreateVocUseCase createVocUseCase;
    private final UpdateVocUseCase updateVocUseCase;
    private final GetVocListUseCase getVocListUseCase;
    private final GetVocDetailUseCase getVocDetailUseCase;
    private final ChangeVocStatusUseCase changeVocStatusUseCase;
    private final AssignVocUseCase assignVocUseCase;
    private final AddMemoUseCase addMemoUseCase;
    private final AsyncVocAnalysisService asyncVocAnalysisService;
    private final GetSimilarVocsUseCase getSimilarVocsUseCase;
    private final SuggestCategoryUseCase suggestCategoryUseCase;
    private final VectorSearchPort vectorSearchPort;
    private final SentimentAnalysisPort sentimentAnalysisPort;
    private final UpdateVocSentimentPort updateVocSentimentPort;
    private final NotificationService notificationService;
    private final Executor vocIndexingExecutor;

    public VocController(
            CreateVocUseCase createVocUseCase,
            UpdateVocUseCase updateVocUseCase,
            GetVocListUseCase getVocListUseCase,
            GetVocDetailUseCase getVocDetailUseCase,
            ChangeVocStatusUseCase changeVocStatusUseCase,
            AssignVocUseCase assignVocUseCase,
            AddMemoUseCase addMemoUseCase,
            AsyncVocAnalysisService asyncVocAnalysisService,
            GetSimilarVocsUseCase getSimilarVocsUseCase,
            SuggestCategoryUseCase suggestCategoryUseCase,
            VectorSearchPort vectorSearchPort,
            SentimentAnalysisPort sentimentAnalysisPort,
            UpdateVocSentimentPort updateVocSentimentPort,
            NotificationService notificationService,
            @Qualifier("vocIndexingExecutor") Executor vocIndexingExecutor
    ) {
        this.createVocUseCase = createVocUseCase;
        this.updateVocUseCase = updateVocUseCase;
        this.getVocListUseCase = getVocListUseCase;
        this.getVocDetailUseCase = getVocDetailUseCase;
        this.changeVocStatusUseCase = changeVocStatusUseCase;
        this.assignVocUseCase = assignVocUseCase;
        this.addMemoUseCase = addMemoUseCase;
        this.asyncVocAnalysisService = asyncVocAnalysisService;
        this.getSimilarVocsUseCase = getSimilarVocsUseCase;
        this.suggestCategoryUseCase = suggestCategoryUseCase;
        this.vectorSearchPort = vectorSearchPort;
        this.sentimentAnalysisPort = sentimentAnalysisPort;
        this.updateVocSentimentPort = updateVocSentimentPort;
        this.notificationService = notificationService;
        this.vocIndexingExecutor = vocIndexingExecutor;
    }

    @Operation(
            summary = "VOC 생성 (즉시 응답, 분석은 백그라운드)",
            description = "새로운 VOC를 생성하고 즉시 응답합니다. AI 로그 분석은 백그라운드에서 수행되며 분석 완료 후 Slack 알림이 전송됩니다."
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VocResponse> createVoc(@Valid @RequestBody CreateVocRequest request) {
        // 1. VOC 생성 (즉시 완료)
        VocDomain voc = createVocUseCase.createVoc(request.toCommand());
        log.info("VOC created: {} (ID: {})", voc.getTicketId(), voc.getId());

        // 2. 분석 레코드 생성 (PENDING 상태)
        asyncVocAnalysisService.createPendingAnalysis(voc.getId());

        // 3. 백그라운드에서 AI 분석 시작 (비동기)
        asyncVocAnalysisService.analyzeVocAsync(voc);
        log.info("Background analysis triggered for VOC: {}", voc.getTicketId());

        // 4. pgvector에 VOC 임베딩 저장 (비동기, 유사 VOC 검색용)
        CompletableFuture.runAsync(() -> {
            try {
                vectorSearchPort.saveEmbedding(voc.getId(), voc.getEmbeddingSourceText());
            } catch (Exception e) {
                log.warn("Failed to save VOC embedding for similarity search: {}", e.getMessage());
            }
        }, vocIndexingExecutor);

        // 5. 감성 분석 (비동기)
        CompletableFuture.runAsync(() -> {
            try {
                String text = voc.getTitle() + " " + voc.getContent();
                SentimentAnalysisPort.SentimentResult sentiment = sentimentAnalysisPort.analyze(text);
                updateVocSentimentPort.updateSentiment(voc.getId(), sentiment.sentiment(), sentiment.confidence());
                log.info("Sentiment analysis completed for VOC {}: {}", voc.getTicketId(), sentiment.sentiment());
            } catch (Exception e) {
                log.warn("Failed to perform sentiment analysis for VOC {}: {}", voc.getTicketId(), e.getMessage());
            }
        }, vocIndexingExecutor);

        // 6. 실시간 알림 발송 (비동기)
        CompletableFuture.runAsync(() -> {
            try {
                notificationService.broadcast(
                        NotificationType.VOC_CREATED,
                        "새 VOC 접수",
                        String.format("[%s] %s", voc.getTicketId(), voc.getTitle()),
                        voc.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send VOC creation notification: {}", e.getMessage());
            }
        }, vocIndexingExecutor);

        // 7. 즉시 응답 (분석 대기 중 상태)
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

        Page<VocDomain> vocPage = getVocListUseCase.getVocList(filter.toQuery());
        VocListResponse response = VocListResponse.from(vocPage);

        return ApiResponse.success(
                response,
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages()
        );
    }

    @Operation(summary = "VOC 상세 조회", description = "ID로 VOC 상세 정보를 조회합니다 (분석 결과 포함)")
    @GetMapping("/{id}")
    public ApiResponse<VocDetailResponse> getVoc(@PathVariable Long id) {
        VocDomain voc = getVocDetailUseCase.getVocById(id);

        // 분석 결과 조회
        VocAnalysisDto analysis = asyncVocAnalysisService.getAnalysis(id).orElse(null);

        VocDetailResponse response = VocDetailResponse.from(voc, analysis);
        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 분석 결과 조회", description = "VOC의 AI 분석 결과만 조회합니다")
    @GetMapping("/{id}/analysis")
    public ApiResponse<VocAnalysisResponse> getVocAnalysis(@PathVariable Long id) {
        VocAnalysisDto analysis = asyncVocAnalysisService.getAnalysis(id).orElse(null);

        if (analysis == null) {
            return ApiResponse.success(null);
        }

        return ApiResponse.success(VocAnalysisResponse.from(analysis));
    }

    @Operation(
            summary = "VOC 재분석",
            description = "VOC의 AI 분석을 다시 수행합니다. 이미 분석 중인 경우 409 Conflict를 반환합니다."
    )
    @PostMapping("/{id}/reanalyze")
    public ResponseEntity<ApiResponse<Void>> reanalyzeVoc(@PathVariable Long id) {
        boolean started = asyncVocAnalysisService.reanalyzeVoc(id);

        if (!started) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(HttpStatus.CONFLICT, "이미 분석이 진행 중입니다."));
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(null));
    }

    @Operation(summary = "VOC 수정", description = "VOC 정보를 수정합니다")
    @PutMapping("/{id}")
    public ApiResponse<VocResponse> updateVoc(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVocRequest request
    ) {
        VocDomain voc = updateVocUseCase.updateVoc(request.toCommand(id));
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 상태 변경", description = "VOC의 상태를 변경합니다")
    @PatchMapping("/{id}/status")
    public ApiResponse<VocResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeStatusRequest request
    ) {
        VocDomain voc = changeVocStatusUseCase.changeStatus(request.toCommand(id));

        // 상태 변경 알림 (비동기)
        CompletableFuture.runAsync(() -> {
            try {
                notificationService.broadcast(
                        NotificationType.STATUS_CHANGED,
                        "VOC 상태 변경",
                        String.format("[%s] 상태가 %s(으)로 변경됨", voc.getTicketId(), voc.getStatus()),
                        voc.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send status change notification: {}", e.getMessage());
            }
        }, vocIndexingExecutor);

        VocResponse response = VocResponse.from(voc);
        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 담당자 배정", description = "VOC에 담당자를 배정합니다")
    @PatchMapping("/{id}/assign")
    public ApiResponse<VocResponse> assignVoc(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request
    ) {
        VocDomain voc = assignVocUseCase.assignVoc(request.toCommand(id));
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 담당자 해제", description = "VOC의 담당자 배정을 해제합니다")
    @PatchMapping("/{id}/unassign")
    public ApiResponse<VocResponse> unassignVoc(@PathVariable Long id) {
        VocDomain voc = assignVocUseCase.unassignVoc(id);
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(summary = "VOC 메모 추가", description = "VOC에 메모를 추가합니다")
    @PostMapping("/{id}/memos")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VocResponse> addMemo(
            @PathVariable Long id,
            @Valid @RequestBody AddMemoRequest request
    ) {
        Long authenticatedUserId;
        boolean hasPrivilegedRole;

        if (securityEnabled) {
            // Production mode: get user from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();
            authenticatedUserId = securityUser.getUserId();
            hasPrivilegedRole = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_MANAGER"));
        } else {
            // Development mode (security.enabled=false): use default user
            log.debug("Security disabled - using default user ID: {}", DEV_DEFAULT_USER_ID);
            authenticatedUserId = DEV_DEFAULT_USER_ID;
            hasPrivilegedRole = true;
        }

        // Determine internal flag based on user role
        boolean isInternal = false;
        if (request.isInternal() != null && request.isInternal()) {
            // Only ADMIN and MANAGER can create internal memos
            if (hasPrivilegedRole) {
                isInternal = true;
            }
            // OPERATOR's request for internal memo is silently ignored (isInternal remains false)
        }

        VocDomain voc = addMemoUseCase.addMemo(
                request.toCommand(id, authenticatedUserId, isInternal),
                authenticatedUserId
        );
        VocResponse response = VocResponse.from(voc);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "유사 VOC 조회",
            description = "현재 VOC와 유사한 VOC 목록을 AI 벡터 검색으로 조회합니다"
    )
    @GetMapping("/{id}/similar")
    public ApiResponse<List<SimilarVocResponse>> getSimilarVocs(
            @PathVariable Long id,
            @Parameter(description = "최대 결과 수 (1~50)") @RequestParam(defaultValue = "5") @jakarta.validation.constraints.Max(50) @jakarta.validation.constraints.Min(1) int limit
    ) {
        List<SimilarVocResult> results = getSimilarVocsUseCase.getSimilarVocs(id, limit);
        List<SimilarVocResponse> response = results.stream()
                .map(SimilarVocResponse::from)
                .toList();
        return ApiResponse.success(response);
    }

    @Operation(
            summary = "AI 카테고리 추천",
            description = "VOC 제목과 내용을 기반으로 AI가 적합한 카테고리를 추천합니다"
    )
    @PostMapping("/suggest-category")
    public ApiResponse<List<CategorySuggestionResponse>> suggestCategory(
            @Valid @RequestBody SuggestCategoryRequest request
    ) {
        List<CategorySuggestionResult> results = suggestCategoryUseCase.suggestCategories(
                request.title(), request.content()
        );
        List<CategorySuggestionResponse> response = results.stream()
                .map(CategorySuggestionResponse::from)
                .toList();
        return ApiResponse.success(response);
    }

    @Operation(
            summary = "상태 변경 이력 조회",
            description = "VOC의 상태 변경 이력을 조회합니다 (향후 구현 예정)"
    )
    @GetMapping("/{id}/history")
    @ResponseStatus(HttpStatus.NOT_IMPLEMENTED)
    public ApiResponse<List<Object>> getVocHistory(@PathVariable Long id) {
        // Feature: VOC status change history (requires VocStatusHistory entity, planned for future sprint)
        return ApiResponse.error(HttpStatus.NOT_IMPLEMENTED, "이 기능은 아직 구현되지 않았습니다.");
    }
}
