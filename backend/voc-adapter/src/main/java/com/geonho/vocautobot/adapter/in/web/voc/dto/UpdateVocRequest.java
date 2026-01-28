package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.UpdateVocCommand;
import com.geonho.vocautobot.domain.voc.VocPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "VOC 수정 요청")
@Getter
@NoArgsConstructor
public class UpdateVocRequest {

    @Schema(description = "제목", example = "상품 배송 지연 문의 (수정)")
    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 200, message = "제목은 200자 이내로 입력해주세요")
    private String title;

    @Schema(description = "내용", example = "주문한 상품이 예정일보다 3일 지연되고 있습니다. (내용 수정)")
    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    @Schema(description = "우선순위", example = "HIGH")
    private VocPriority priority;

    @Schema(description = "카테고리 ID", example = "1")
    private Long categoryId;

    public UpdateVocCommand toCommand(Long vocId) {
        return new UpdateVocCommand(
                vocId,
                title,
                content,
                priority,
                categoryId
        );
    }
}
