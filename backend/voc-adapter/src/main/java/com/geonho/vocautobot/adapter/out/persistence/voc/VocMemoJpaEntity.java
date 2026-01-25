package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "voc_memos", indexes = {
    @Index(name = "idx_memo_voc", columnList = "voc_id"),
    @Index(name = "idx_memo_author", columnList = "author_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VocMemoJpaEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voc_id", nullable = false)
    @Setter
    private VocJpaEntity voc;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_internal", nullable = false)
    private boolean internal;

    public VocMemoJpaEntity(Long authorId, String content, boolean internal) {
        this.authorId = authorId;
        this.content = content;
        this.internal = internal;
    }

    public void updateContent(String content) {
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }
}
