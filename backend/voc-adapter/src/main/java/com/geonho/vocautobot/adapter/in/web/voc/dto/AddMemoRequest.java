package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.AddMemoCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "VOC 메모 추가 요청")
public record AddMemoRequest(
        @Schema(description = "메모 내용", example = "고객 요청사항 확인 완료")
        @NotBlank(message = "메모 내용은 필수입니다")
        String content,

        @Schema(description = "내부 메모 여부", example = "false")
        @NotNull(message = "내부 메모 여부는 필수입니다")
        Boolean internal,

        @Schema(description = "작성자 ID", example = "1")
        @NotNull(message = "작성자 ID는 필수입니다")
        Long authorId
) {
    public AddMemoCommand toCommand(Long vocId) {
        return new AddMemoCommand(
                vocId,
                content,
                internal,
                authorId
        );
    }
}
