package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.domain.voc.VocDomain;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

@Schema(description = "VOC 목록 응답")
public record VocListResponse(

        @Schema(description = "VOC 목록")
        List<VocResponse> content,

        @Schema(description = "현재 페이지", example = "0")
        int page,

        @Schema(description = "페이지 크기", example = "20")
        int size,

        @Schema(description = "전체 요소 수", example = "100")
        long totalElements,

        @Schema(description = "전체 페이지 수", example = "5")
        int totalPages,

        @Schema(description = "첫 페이지 여부")
        boolean first,

        @Schema(description = "마지막 페이지 여부")
        boolean last,

        @Schema(description = "빈 페이지 여부")
        boolean empty
) {
    public static VocListResponse from(Page<VocDomain> vocPage) {
        List<VocResponse> content = vocPage.getContent().stream()
                .map(VocResponse::from)
                .toList();

        return new VocListResponse(
                content,
                vocPage.getNumber(),
                vocPage.getSize(),
                vocPage.getTotalElements(),
                vocPage.getTotalPages(),
                vocPage.isFirst(),
                vocPage.isLast(),
                vocPage.isEmpty()
        );
    }
}
