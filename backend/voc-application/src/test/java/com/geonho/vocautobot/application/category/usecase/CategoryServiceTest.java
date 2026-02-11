package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.CreateCategoryCommand;
import com.geonho.vocautobot.application.category.port.in.UpdateCategoryCommand;
import com.geonho.vocautobot.application.category.port.out.CheckCategoryUsagePort;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.category.port.out.SaveCategoryPort;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("카테고리 서비스 테스트")
class CategoryServiceTest {

    @Mock
    private LoadCategoryPort loadCategoryPort;

    @Mock
    private SaveCategoryPort saveCategoryPort;

    @Mock
    private CheckCategoryUsagePort checkCategoryUsagePort;

    @InjectMocks
    private CreateCategoryService createCategoryService;

    @InjectMocks
    private DeleteCategoryService deleteCategoryService;

    @InjectMocks
    private UpdateCategoryService updateCategoryService;

    private static Category createSampleCategory() {
        return new Category(
                1L, "배송", "DELIVERY", CategoryType.MAIN, null,
                "배송 관련 카테고리", true, 1, 1,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("카테고리 생성")
    class CreateCategory {

        @Test
        @DisplayName("루트 카테고리 생성 성공")
        void shouldCreateRootCategory() {
            CreateCategoryCommand command = new CreateCategoryCommand(
                    "배송", "DELIVERY", CategoryType.MAIN, null, "배송 관련", 1
            );
            given(loadCategoryPort.existsByCode("DELIVERY")).willReturn(false);
            given(saveCategoryPort.save(any(Category.class))).willAnswer(invocation -> {
                Category cat = invocation.getArgument(0);
                cat.setId(1L);
                return cat;
            });

            Category result = createCategoryService.createCategory(command);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("배송");
            verify(saveCategoryPort).save(any(Category.class));
        }

        @Test
        @DisplayName("중복 코드로 생성 시 예외 발생")
        void shouldThrowWhenCodeDuplicate() {
            CreateCategoryCommand command = new CreateCategoryCommand(
                    "배송", "DELIVERY", CategoryType.MAIN, null, "배송 관련", 1
            );
            given(loadCategoryPort.existsByCode("DELIVERY")).willReturn(true);

            assertThatThrownBy(() -> createCategoryService.createCategory(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 사용 중인 카테고리 코드");
        }

        @Test
        @DisplayName("하위 카테고리 생성 - 상위 카테고리 없으면 예외")
        void shouldThrowWhenParentNotFound() {
            CreateCategoryCommand command = new CreateCategoryCommand(
                    "택배", "PARCEL", CategoryType.SUB, 999L, "택배 배송", 1
            );
            given(loadCategoryPort.existsByCode("PARCEL")).willReturn(false);
            given(loadCategoryPort.loadById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> createCategoryService.createCategory(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("상위 카테고리를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("비활성 상위 카테고리에 하위 생성 시 예외")
        void shouldThrowWhenParentInactive() {
            Category inactiveParent = new Category(
                    1L, "비활성", "INACTIVE", CategoryType.MAIN, null,
                    "비활성", false, 1, 1, LocalDateTime.now(), LocalDateTime.now()
            );
            CreateCategoryCommand command = new CreateCategoryCommand(
                    "하위", "CHILD", CategoryType.SUB, 1L, "하위", 1
            );
            given(loadCategoryPort.existsByCode("CHILD")).willReturn(false);
            given(loadCategoryPort.loadById(1L)).willReturn(Optional.of(inactiveParent));

            assertThatThrownBy(() -> createCategoryService.createCategory(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("비활성 상태");
        }
    }

    @Nested
    @DisplayName("카테고리 삭제")
    class DeleteCategory {

        @Test
        @DisplayName("카테고리 삭제 성공")
        void shouldDeleteCategory() {
            Category category = createSampleCategory();
            given(loadCategoryPort.loadById(1L)).willReturn(Optional.of(category));
            given(loadCategoryPort.existsByParentId(1L)).willReturn(false);
            given(checkCategoryUsagePort.isCategoryInUse(1L)).willReturn(false);

            deleteCategoryService.deleteCategory(1L);

            verify(saveCategoryPort).deleteById(1L);
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 삭제 시 예외")
        void shouldThrowWhenCategoryNotFound() {
            given(loadCategoryPort.loadById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> deleteCategoryService.deleteCategory(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("카테고리를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("하위 카테고리가 있으면 삭제 불가")
        void shouldThrowWhenHasChildren() {
            Category category = createSampleCategory();
            given(loadCategoryPort.loadById(1L)).willReturn(Optional.of(category));
            given(loadCategoryPort.existsByParentId(1L)).willReturn(true);

            assertThatThrownBy(() -> deleteCategoryService.deleteCategory(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("하위 카테고리");
        }

        @Test
        @DisplayName("VOC에 사용 중인 카테고리는 삭제 불가")
        void shouldThrowWhenCategoryInUse() {
            Category category = createSampleCategory();
            given(loadCategoryPort.loadById(1L)).willReturn(Optional.of(category));
            given(loadCategoryPort.existsByParentId(1L)).willReturn(false);
            given(checkCategoryUsagePort.isCategoryInUse(1L)).willReturn(true);

            assertThatThrownBy(() -> deleteCategoryService.deleteCategory(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용 중인 카테고리");
        }
    }
}
