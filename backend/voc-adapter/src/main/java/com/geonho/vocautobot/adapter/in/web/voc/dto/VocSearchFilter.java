package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.VocListQuery;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "VOC 검색 필터")
@Getter
@Setter
@NoArgsConstructor
public class VocSearchFilter {

    @Schema(description = "상태", example = "NEW")
    private VocStatus status;

    @Schema(description = "우선순위", example = "NORMAL")
    private VocPriority priority;

    @Schema(description = "카테고리 ID", example = "1")
    private Long categoryId;

    @Schema(description = "담당자 ID", example = "5")
    private Long assigneeId;

    @Schema(description = "고객 이메일", example = "customer@example.com")
    private String customerEmail;

    @Schema(description = "검색 키워드 (제목, 내용)", example = "배송")
    private String search;

    @Schema(description = "페이지 번호 (0부터 시작)", example = "0")
    private int page = 0;

    @Schema(description = "페이지 크기", example = "20")
    private int size = 20;

    @Schema(description = "정렬 필드", example = "createdAt")
    private String sortBy = "createdAt";

    @Schema(description = "정렬 방향", example = "DESC")
    private String sortDirection = "DESC";

    public VocListQuery toQuery() {
        return VocListQuery.of(
                status,
                priority,
                categoryId,
                assigneeId,
                customerEmail,
                search,
                page,
                size,
                sortBy,
                sortDirection
        );
    }
}
