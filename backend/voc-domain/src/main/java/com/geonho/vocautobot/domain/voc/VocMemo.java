package com.geonho.vocautobot.domain.voc;

import com.geonho.vocautobot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "voc_memos", indexes = {
    @Index(name = "idx_memo_voc", columnList = "voc_id"),
    @Index(name = "idx_memo_author", columnList = "author_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class VocMemo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voc_id", nullable = false)
    @Setter
    private Voc voc;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_internal", nullable = false)
    @Builder.Default
    private boolean internal = false;

    // Business methods
    public void updateContent(String content) {
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    public void markAsInternal() {
        this.internal = true;
    }

    public void markAsPublic() {
        this.internal = false;
    }
}
