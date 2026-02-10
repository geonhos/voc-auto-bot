package com.geonho.vocautobot.adapter.in.web.voc;

import com.geonho.vocautobot.adapter.common.exception.GlobalExceptionHandler;
import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import com.geonho.vocautobot.application.analysis.port.out.VectorSearchPort;
import com.geonho.vocautobot.application.analysis.service.AsyncVocAnalysisService;
import com.geonho.vocautobot.application.voc.port.in.*;
import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VocController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {"security.enabled=false"})
@DisplayName("VocController 통합 테스트")
class VocControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CreateVocUseCase createVocUseCase;

    @MockBean
    private UpdateVocUseCase updateVocUseCase;

    @MockBean
    private GetVocListUseCase getVocListUseCase;

    @MockBean
    private GetVocDetailUseCase getVocDetailUseCase;

    @MockBean
    private ChangeVocStatusUseCase changeVocStatusUseCase;

    @MockBean
    private AssignVocUseCase assignVocUseCase;

    @MockBean
    private AddMemoUseCase addMemoUseCase;

    @MockBean
    private AsyncVocAnalysisService asyncVocAnalysisService;

    @MockBean
    private GetSimilarVocsUseCase getSimilarVocsUseCase;

    @MockBean
    private VectorSearchPort vectorSearchPort;

    @MockBean(name = "vocIndexingExecutor")
    private Executor vocIndexingExecutor;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private static VocDomain createSampleVoc() {
        return VocDomain.builder()
                .id(1L)
                .ticketId("VOC-20260210-0001")
                .title("배송 지연 문의")
                .content("주문한 상품이 3일째 배송되지 않습니다.")
                .status(VocStatus.NEW)
                .priority(VocPriority.NORMAL)
                .categoryId(1L)
                .customerEmail("customer@example.com")
                .customerName("홍길동")
                .customerPhone("010-1234-5678")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("POST /v1/vocs - VOC 생성")
    class CreateVoc {

        @Test
        @DisplayName("유효한 요청으로 VOC 생성 성공")
        void shouldCreateVocWithValidRequest() throws Exception {
            VocDomain voc = createSampleVoc();
            given(createVocUseCase.createVoc(any())).willReturn(voc);

            String requestBody = """
                    {
                        "title": "배송 지연 문의",
                        "content": "주문한 상품이 3일째 배송되지 않습니다.",
                        "categoryId": 1,
                        "customerEmail": "customer@example.com",
                        "customerName": "홍길동",
                        "customerPhone": "010-1234-5678",
                        "priority": "NORMAL"
                    }
                    """;

            mockMvc.perform(post("/v1/vocs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.ticketId").value("VOC-20260210-0001"))
                    .andExpect(jsonPath("$.data.title").value("배송 지연 문의"))
                    .andExpect(jsonPath("$.data.status").value("NEW"));
        }

        @Test
        @DisplayName("제목 누락 시 400 에러")
        void shouldReturn400WhenTitleMissing() throws Exception {
            String requestBody = """
                    {
                        "content": "내용",
                        "categoryId": 1,
                        "customerEmail": "customer@example.com"
                    }
                    """;

            mockMvc.perform(post("/v1/vocs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("이메일 형식 잘못된 경우 400 에러")
        void shouldReturn400WhenInvalidEmail() throws Exception {
            String requestBody = """
                    {
                        "title": "테스트",
                        "content": "내용",
                        "categoryId": 1,
                        "customerEmail": "invalid-email"
                    }
                    """;

            mockMvc.perform(post("/v1/vocs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("카테고리 ID 누락 시 400 에러")
        void shouldReturn400WhenCategoryIdMissing() throws Exception {
            String requestBody = """
                    {
                        "title": "테스트",
                        "content": "내용",
                        "customerEmail": "customer@example.com"
                    }
                    """;

            mockMvc.perform(post("/v1/vocs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("GET /v1/vocs - VOC 목록 조회")
    class GetVocList {

        @Test
        @DisplayName("페이징된 VOC 목록 조회 성공")
        void shouldReturnPagedVocList() throws Exception {
            VocDomain voc = createSampleVoc();
            Page<VocDomain> page = new PageImpl<>(List.of(voc), PageRequest.of(0, 20), 1);
            given(getVocListUseCase.getVocList(any())).willReturn(page);

            mockMvc.perform(get("/v1/vocs")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content[0].ticketId").value("VOC-20260210-0001"))
                    .andExpect(jsonPath("$.meta.totalElements").value(1));
        }

        @Test
        @DisplayName("상태 필터링된 VOC 목록 조회")
        void shouldReturnFilteredVocList() throws Exception {
            Page<VocDomain> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
            given(getVocListUseCase.getVocList(any())).willReturn(emptyPage);

            mockMvc.perform(get("/v1/vocs")
                            .param("status", "NEW")
                            .param("priority", "HIGH"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }
    }

    @Nested
    @DisplayName("GET /v1/vocs/{id} - VOC 상세 조회")
    class GetVocDetail {

        @Test
        @DisplayName("VOC 상세 조회 성공")
        void shouldReturnVocDetail() throws Exception {
            VocDomain voc = createSampleVoc();
            given(getVocDetailUseCase.getVocById(1L)).willReturn(voc);
            given(asyncVocAnalysisService.getAnalysis(1L)).willReturn(Optional.empty());

            mockMvc.perform(get("/v1/vocs/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.ticketId").value("VOC-20260210-0001"));
        }

        @Test
        @DisplayName("분석 결과 포함된 VOC 상세 조회")
        void shouldReturnVocDetailWithAnalysis() throws Exception {
            VocDomain voc = createSampleVoc();
            VocAnalysisDto analysis = new VocAnalysisDto(
                    1L, 1L, "COMPLETED", "배송 지연 이슈",
                    0.85, List.of("배송", "지연"), List.of("물류 지연"),
                    List.of(), "고객 연락 후 재배송 안내", null,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            given(getVocDetailUseCase.getVocById(1L)).willReturn(voc);
            given(asyncVocAnalysisService.getAnalysis(1L)).willReturn(Optional.of(analysis));

            mockMvc.perform(get("/v1/vocs/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.aiAnalysis.status").value("COMPLETED"))
                    .andExpect(jsonPath("$.data.aiAnalysis.summary").value("배송 지연 이슈"));
        }
    }

    @Nested
    @DisplayName("PATCH /v1/vocs/{id}/status - VOC 상태 변경")
    class ChangeStatus {

        @Test
        @DisplayName("상태 변경 성공")
        void shouldChangeStatusSuccessfully() throws Exception {
            VocDomain voc = VocDomain.builder()
                    .id(1L)
                    .ticketId("VOC-20260210-0001")
                    .title("배송 지연 문의")
                    .content("내용")
                    .status(VocStatus.IN_PROGRESS)
                    .priority(VocPriority.NORMAL)
                    .customerEmail("customer@example.com")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            given(changeVocStatusUseCase.changeStatus(any())).willReturn(voc);

            String requestBody = """
                    {
                        "status": "IN_PROGRESS"
                    }
                    """;

            mockMvc.perform(patch("/v1/vocs/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
        }

        @Test
        @DisplayName("상태 값 누락 시 400 에러")
        void shouldReturn400WhenStatusMissing() throws Exception {
            String requestBody = "{}";

            mockMvc.perform(patch("/v1/vocs/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("PATCH /v1/vocs/{id}/assign - VOC 담당자 배정")
    class AssignVoc {

        @Test
        @DisplayName("담당자 배정 성공")
        void shouldAssignVocSuccessfully() throws Exception {
            VocDomain voc = VocDomain.builder()
                    .id(1L)
                    .ticketId("VOC-20260210-0001")
                    .title("배송 지연 문의")
                    .content("내용")
                    .status(VocStatus.IN_PROGRESS)
                    .priority(VocPriority.NORMAL)
                    .customerEmail("customer@example.com")
                    .assigneeId(5L)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            given(assignVocUseCase.assignVoc(any())).willReturn(voc);

            String requestBody = """
                    {
                        "assigneeId": 5
                    }
                    """;

            mockMvc.perform(patch("/v1/vocs/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.assigneeId").value(5));
        }

        @Test
        @DisplayName("담당자 ID 누락 시 400 에러")
        void shouldReturn400WhenAssigneeIdMissing() throws Exception {
            String requestBody = "{}";

            mockMvc.perform(patch("/v1/vocs/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("PUT /v1/vocs/{id} - VOC 수정")
    class UpdateVoc {

        @Test
        @DisplayName("VOC 수정 성공")
        void shouldUpdateVocSuccessfully() throws Exception {
            VocDomain voc = VocDomain.builder()
                    .id(1L)
                    .ticketId("VOC-20260210-0001")
                    .title("배송 지연 문의 (수정)")
                    .content("내용 수정됨")
                    .status(VocStatus.NEW)
                    .priority(VocPriority.HIGH)
                    .customerEmail("customer@example.com")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            given(updateVocUseCase.updateVoc(any())).willReturn(voc);

            String requestBody = """
                    {
                        "title": "배송 지연 문의 (수정)",
                        "content": "내용 수정됨",
                        "priority": "HIGH"
                    }
                    """;

            mockMvc.perform(put("/v1/vocs/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("배송 지연 문의 (수정)"))
                    .andExpect(jsonPath("$.data.priority").value("HIGH"));
        }
    }

    @Nested
    @DisplayName("GET /v1/vocs/{id}/similar - 유사 VOC 조회")
    class GetSimilarVocs {

        @Test
        @DisplayName("유사 VOC 조회 성공")
        void shouldReturnSimilarVocs() throws Exception {
            SimilarVocResult result = new SimilarVocResult(
                    2L, "VOC-20260210-0002", "유사 배송 문의",
                    VocStatus.RESOLVED, 0.85, LocalDateTime.now()
            );
            given(getSimilarVocsUseCase.getSimilarVocs(1L, 5)).willReturn(List.of(result));

            mockMvc.perform(get("/v1/vocs/1/similar")
                            .param("limit", "5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].ticketId").value("VOC-20260210-0002"));
        }
    }
}
