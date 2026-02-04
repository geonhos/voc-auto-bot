package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.adapter.common.util.XssProtectionUtil;
import com.geonho.vocautobot.application.voc.port.in.dto.AddMemoCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "VOC 메모 추가 요청")
public record AddMemoRequest(
        @Schema(description = "메모 내용", example = "고객 요청사항 확인 완료")
        @NotBlank(message = "메모 내용은 필수입니다")
        String content,

        @Schema(
                description = "내부 메모 여부 (ADMIN, MANAGER만 true 가능, OPERATOR는 무시됨)",
                example = "false",
                nullable = true
        )
        Boolean isInternal
) {
    /**
     * Converts this request to a command object with XSS protection applied.
     * <p>
     * The content field is HTML sanitized to allow safe formatting (bold, italic, links, etc.)
     * while removing dangerous elements like scripts and event handlers.
     * </p>
     *
     * @param vocId     the VOC ID
     * @param authorId  the author's user ID
     * @param internal  whether this is an internal memo
     * @return AddMemoCommand with sanitized content
     */
    public AddMemoCommand toCommand(Long vocId, Long authorId, boolean internal) {
        return new AddMemoCommand(
                vocId,
                XssProtectionUtil.sanitizeHtml(content),
                internal,
                authorId
        );
    }
}
