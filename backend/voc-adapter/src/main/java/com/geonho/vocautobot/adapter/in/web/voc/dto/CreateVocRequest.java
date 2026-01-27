package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.CreateVocCommand;
import com.geonho.vocautobot.domain.voc.VocPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "VOC 생성 요청")
@Getter
@NoArgsConstructor
public class CreateVocRequest {

    @Schema(description = "제목", example = "상품 배송 지연 문의")
    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 200, message = "제목은 200자 이내로 입력해주세요")
    private String title;

    @Schema(description = "내용", example = "주문한 상품이 예정일보다 3일 지연되고 있습니다.")
    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    @Schema(description = "카테고리 ID", example = "1")
    @NotNull(message = "카테고리를 선택해주세요")
    private Long categoryId;

    @Schema(description = "고객 이메일", example = "customer@example.com")
    @NotBlank(message = "고객 이메일을 입력해주세요")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자 이내로 입력해주세요")
    private String customerEmail;

    @Schema(description = "고객명", example = "홍길동")
    @Size(max = 100, message = "고객명은 100자 이내로 입력해주세요")
    private String customerName;

    @Schema(description = "고객 전화번호", example = "010-1234-5678")
    @Size(max = 20, message = "전화번호는 20자 이내로 입력해주세요")
    private String customerPhone;

    @Schema(description = "우선순위", example = "NORMAL")
    private VocPriority priority;

    public CreateVocCommand toCommand() {
        return new CreateVocCommand(
                title,
                content,
                categoryId,
                customerEmail,
                customerName,
                customerPhone,
                priority
        );
    }
}
