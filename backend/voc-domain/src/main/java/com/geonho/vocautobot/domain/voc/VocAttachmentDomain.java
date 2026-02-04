package com.geonho.vocautobot.domain.voc;

import com.geonho.vocautobot.domain.common.Auditable;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Pure domain model for VOC Attachment.
 * This class contains only business logic without any JPA/persistence dependencies.
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id")
public class VocAttachmentDomain implements Auditable {

    private final Long id;
    private final Long vocId;
    private final String originalFilename;
    private final String storedFilename;
    private final String filePath;
    private final Long fileSize;
    private final String contentType;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /**
     * Factory method to create a new attachment.
     */
    public static VocAttachmentDomain create(
            String originalFilename,
            String storedFilename,
            String filePath,
            Long fileSize,
            String contentType
    ) {
        validateRequired(originalFilename, "originalFilename");
        validateRequired(storedFilename, "storedFilename");
        validateRequired(filePath, "filePath");
        validateRequired(fileSize, "fileSize");

        return VocAttachmentDomain.builder()
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Checks if this attachment is an image.
     *
     * @return true if content type starts with "image/"
     */
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * Checks if this attachment is a PDF.
     *
     * @return true if content type is "application/pdf"
     */
    public boolean isPdf() {
        return contentType != null && contentType.equals("application/pdf");
    }

    /**
     * Gets the file extension from the original filename.
     *
     * @return file extension or empty string if not found
     */
    public String getFileExtension() {
        if (originalFilename == null) {
            return "";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        return dotIndex > 0 ? originalFilename.substring(dotIndex + 1).toLowerCase() : "";
    }

    /**
     * Gets the file size in a human-readable format.
     *
     * @return formatted file size (e.g., "1.5 MB")
     */
    public String getFormattedFileSize() {
        if (fileSize == null || fileSize <= 0) {
            return "0 B";
        }

        final String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unitIndex = 0;
        double size = fileSize;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return String.format("%.1f %s", size, units[unitIndex]);
    }

    private static void validateRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }

    private static void validateRequired(Long value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
}
