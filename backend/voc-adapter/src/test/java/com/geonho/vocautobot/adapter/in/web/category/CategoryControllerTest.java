package com.geonho.vocautobot.adapter.in.web.category;

import com.geonho.vocautobot.adapter.common.exception.GlobalExceptionHandler;
import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import com.geonho.vocautobot.application.category.port.in.CreateCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.DeleteCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.GetCategoryQuery;
import com.geonho.vocautobot.application.category.port.in.UpdateCategoryUseCase;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {"security.enabled=false"})
@DisplayName("CategoryController 통합 테스트")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CreateCategoryUseCase createCategoryUseCase;

    @MockBean
    private UpdateCategoryUseCase updateCategoryUseCase;

    @MockBean
    private DeleteCategoryUseCase deleteCategoryUseCase;

    @MockBean
    private GetCategoryQuery getCategoryQuery;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private static Category createSampleCategory() {
        return new Category(
                1L, "배송", "DELIVERY", CategoryType.MAIN, null,
                "배송 관련 카테고리", true, 1, 1,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("GET /v1/categories - 카테고리 목록 조회")
    class GetCategories {

        @Test
        @DisplayName("카테고리 목록 조회 성공")
        void shouldReturnCategoryList() throws Exception {
            Category category = createSampleCategory();
            given(getCategoryQuery.getAllCategories()).willReturn(List.of(category));

            mockMvc.perform(get("/v1/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("배송"))
                    .andExpect(jsonPath("$.data[0].type").value("MAIN"));
        }

        @Test
        @DisplayName("빈 카테고리 목록 조회")
        void shouldReturnEmptyCategoryList() throws Exception {
            given(getCategoryQuery.getAllCategories()).willReturn(List.of());

            mockMvc.perform(get("/v1/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /v1/categories/tree - 카테고리 트리 조회")
    class GetCategoryTree {

        @Test
        @DisplayName("카테고리 트리 조회 성공")
        void shouldReturnCategoryTree() throws Exception {
            Category parent = createSampleCategory();
            Category child = new Category(
                    2L, "택배", "PARCEL", CategoryType.SUB, 1L,
                    "택배 배송", true, 1, 2,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            parent.setChildren(List.of(child));
            given(getCategoryQuery.getCategoryTree()).willReturn(List.of(parent));

            mockMvc.perform(get("/v1/categories/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("배송"))
                    .andExpect(jsonPath("$.data[0].children").isArray())
                    .andExpect(jsonPath("$.data[0].children[0].name").value("택배"));
        }
    }

    @Nested
    @DisplayName("GET /v1/categories/{id} - 카테고리 상세 조회")
    class GetCategory {

        @Test
        @DisplayName("카테고리 상세 조회 성공")
        void shouldReturnCategoryById() throws Exception {
            Category category = createSampleCategory();
            given(getCategoryQuery.getCategoryById(1L)).willReturn(category);

            mockMvc.perform(get("/v1/categories/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("배송"))
                    .andExpect(jsonPath("$.data.type").value("MAIN"));
        }
    }

    @Nested
    @DisplayName("POST /v1/categories - 카테고리 생성")
    class CreateCategory {

        @Test
        @DisplayName("대분류 카테고리 생성 성공")
        void shouldCreateMainCategory() throws Exception {
            Category category = createSampleCategory();
            given(createCategoryUseCase.createCategory(any())).willReturn(category);

            String requestBody = """
                    {
                        "name": "배송",
                        "code": "DELIVERY",
                        "type": "MAIN",
                        "description": "배송 관련 카테고리",
                        "sortOrder": 1
                    }
                    """;

            mockMvc.perform(post("/v1/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("배송"));
        }

        @Test
        @DisplayName("이름 누락 시 400 에러")
        void shouldReturn400WhenNameMissing() throws Exception {
            String requestBody = """
                    {
                        "code": "DELIVERY",
                        "type": "MAIN",
                        "sortOrder": 1
                    }
                    """;

            mockMvc.perform(post("/v1/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("타입 누락 시 400 에러")
        void shouldReturn400WhenTypeMissing() throws Exception {
            String requestBody = """
                    {
                        "name": "배송",
                        "code": "DELIVERY",
                        "sortOrder": 1
                    }
                    """;

            mockMvc.perform(post("/v1/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("정렬 순서 0 이하 시 400 에러")
        void shouldReturn400WhenSortOrderInvalid() throws Exception {
            String requestBody = """
                    {
                        "name": "배송",
                        "code": "DELIVERY",
                        "type": "MAIN",
                        "sortOrder": 0
                    }
                    """;

            mockMvc.perform(post("/v1/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("PUT /v1/categories/{id} - 카테고리 수정")
    class UpdateCategory {

        @Test
        @DisplayName("카테고리 수정 성공")
        void shouldUpdateCategorySuccessfully() throws Exception {
            Category updated = new Category(
                    1L, "배송 (수정)", "DELIVERY", CategoryType.MAIN, null,
                    "수정된 설명", true, 2, 1,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            given(updateCategoryUseCase.updateCategory(any())).willReturn(updated);

            String requestBody = """
                    {
                        "name": "배송 (수정)",
                        "description": "수정된 설명",
                        "isActive": true,
                        "sortOrder": 2
                    }
                    """;

            mockMvc.perform(put("/v1/categories/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("배송 (수정)"));
        }
    }

    @Nested
    @DisplayName("DELETE /v1/categories/{id} - 카테고리 삭제")
    class DeleteCategory {

        @Test
        @DisplayName("카테고리 삭제 성공")
        void shouldDeleteCategorySuccessfully() throws Exception {
            doNothing().when(deleteCategoryUseCase).deleteCategory(1L);

            mockMvc.perform(delete("/v1/categories/1"))
                    .andExpect(status().isNoContent());
        }
    }
}
