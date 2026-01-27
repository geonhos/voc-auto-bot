package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "voc_attachments", indexes = {
    @Index(name = "idx_attachment_voc", columnList = "voc_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VocAttachmentJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voc_id", nullable = false)
    @Setter
    private VocJpaEntity voc;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    public VocAttachmentJpaEntity(String originalFilename, String storedFilename,
                                  String filePath, Long fileSize, String contentType) {
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
    }
}
