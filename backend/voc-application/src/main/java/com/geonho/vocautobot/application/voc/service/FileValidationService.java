package com.geonho.vocautobot.application.voc.service;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.voc.exception.FileValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Service for validating uploaded files for security.
 *
 * <p>This service performs comprehensive file validation including:
 * <ul>
 *   <li>Extension whitelist validation</li>
 *   <li>MIME type validation via magic bytes detection</li>
 *   <li>File size limit enforcement</li>
 *   <li>Filename sanitization</li>
 * </ul>
 *
 * <p>Security considerations:
 * <ul>
 *   <li>Extension validation alone is not sufficient as it can be easily spoofed</li>
 *   <li>Magic byte validation provides content-based verification</li>
 *   <li>Both checks should be used together for defense in depth</li>
 * </ul>
 */
@Slf4j
@UseCase
@RequiredArgsConstructor
public class FileValidationService {

    /**
     * Maximum file size in bytes (10 MB)
     */
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**
     * Allowed file extensions (lowercase)
     */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "xls", "xlsx"
    );

    /**
     * Magic bytes (file signatures) for MIME type detection.
     * Key: magic byte prefix (hex), Value: expected extension
     */
    private static final Map<byte[], Set<String>> MAGIC_BYTES = Map.ofEntries(
            // PDF: %PDF
            Map.entry(new byte[]{0x25, 0x50, 0x44, 0x46}, Set.of("pdf")),
            // PNG: 89 50 4E 47
            Map.entry(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47}, Set.of("png")),
            // JPEG: FF D8 FF
            Map.entry(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}, Set.of("jpg", "jpeg")),
            // GIF87a and GIF89a: 47 49 46 38
            Map.entry(new byte[]{0x47, 0x49, 0x46, 0x38}, Set.of("gif")),
            // DOC/XLS (OLE2 Compound Document): D0 CF 11 E0
            Map.entry(new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0}, Set.of("doc", "xls")),
            // DOCX/XLSX (ZIP-based): 50 4B 03 04 (PK..)
            Map.entry(new byte[]{0x50, 0x4B, 0x03, 0x04}, Set.of("docx", "xlsx"))
    );

    /**
     * Pattern for valid filename characters.
     * Allows alphanumeric, dot, hyphen, underscore, space, and Korean characters.
     */
    private static final Pattern SAFE_FILENAME_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9가-힣._\\- ]+$"
    );

    /**
     * Pattern for potentially dangerous filename patterns
     */
    private static final Pattern DANGEROUS_FILENAME_PATTERN = Pattern.compile(
            "(?i)(\\.\\.|[<>:\"/\\\\|?*\\x00-\\x1f]|^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\\..*)?$)"
    );

    /**
     * Validates an uploaded file for security.
     *
     * @param filename    the original filename
     * @param fileSize    the file size in bytes
     * @param inputStream the file content stream for magic byte validation
     * @return ValidationResult containing sanitized filename or error
     * @throws FileValidationException if the file fails validation
     */
    public ValidationResult validate(String filename, long fileSize, InputStream inputStream) {
        // 1. Validate filename
        if (filename == null || filename.isBlank()) {
            throw new FileValidationException("Filename is required");
        }

        // 2. Validate file size
        validateFileSize(fileSize);

        // 3. Extract and validate extension
        String extension = extractExtension(filename);
        validateExtension(extension);

        // 4. Validate magic bytes match extension
        try {
            validateMagicBytes(inputStream, extension);
        } catch (IOException e) {
            log.error("Failed to read file content for validation", e);
            throw new FileValidationException("Failed to validate file content");
        }

        // 5. Sanitize filename
        String sanitizedFilename = sanitizeFilename(filename);

        log.debug("File validated successfully: original={}, sanitized={}, size={}, extension={}",
                filename, sanitizedFilename, fileSize, extension);

        return new ValidationResult(sanitizedFilename, extension, fileSize);
    }

    /**
     * Validates file size against the maximum limit.
     *
     * @param fileSize the file size in bytes
     * @throws FileValidationException if size exceeds limit
     */
    public void validateFileSize(long fileSize) {
        if (fileSize <= 0) {
            throw new FileValidationException("File is empty");
        }
        if (fileSize > MAX_FILE_SIZE) {
            throw new FileValidationException(
                    String.format("File size exceeds maximum limit of %d MB", MAX_FILE_SIZE / (1024 * 1024))
            );
        }
    }

    /**
     * Validates that the extension is in the whitelist.
     *
     * @param extension the file extension (without dot)
     * @throws FileValidationException if extension is not allowed
     */
    public void validateExtension(String extension) {
        if (extension == null || extension.isBlank()) {
            throw new FileValidationException("File must have an extension");
        }
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new FileValidationException(
                    String.format("File extension '%s' is not allowed. Allowed extensions: %s",
                            extension, ALLOWED_EXTENSIONS)
            );
        }
    }

    /**
     * Validates that the file content matches the claimed extension by checking magic bytes.
     *
     * @param inputStream the file content stream
     * @param extension   the claimed file extension
     * @throws IOException             if reading the stream fails
     * @throws FileValidationException if content doesn't match extension
     */
    public void validateMagicBytes(InputStream inputStream, String extension) throws IOException {
        if (inputStream == null) {
            throw new FileValidationException("File content is required for validation");
        }

        byte[] header = new byte[8];
        int bytesRead = inputStream.read(header);

        if (bytesRead < 3) {
            throw new FileValidationException("File is too small to validate");
        }

        String lowerExtension = extension.toLowerCase();
        boolean matched = false;

        for (Map.Entry<byte[], Set<String>> entry : MAGIC_BYTES.entrySet()) {
            byte[] magic = entry.getKey();
            Set<String> extensions = entry.getValue();

            if (extensions.contains(lowerExtension) && startsWith(header, magic)) {
                matched = true;
                break;
            }
        }

        if (!matched) {
            log.warn("File content does not match claimed extension: {}", extension);
            throw new FileValidationException(
                    "File content does not match the declared file type"
            );
        }
    }

    /**
     * Extracts the file extension from a filename.
     *
     * @param filename the filename
     * @return the extension (without dot), or empty string if no extension
     */
    public String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot <= 0 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot + 1).toLowerCase();
    }

    /**
     * Sanitizes a filename to prevent path traversal and other attacks.
     *
     * @param filename the original filename
     * @return the sanitized filename
     * @throws FileValidationException if filename contains dangerous patterns
     */
    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new FileValidationException("Filename cannot be empty");
        }

        // Check for path traversal patterns BEFORE extracting base name
        // This prevents attacks like "../../../etc/passwd"
        if (filename.contains("..")) {
            throw new FileValidationException("Filename contains invalid characters or patterns");
        }

        // Remove path separators and extract just the filename
        String baseName = filename;
        int lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (lastSlash >= 0) {
            baseName = filename.substring(lastSlash + 1);
        }

        // Check for other dangerous patterns (reserved names, special characters)
        if (DANGEROUS_FILENAME_PATTERN.matcher(baseName).find()) {
            throw new FileValidationException("Filename contains invalid characters or patterns");
        }

        // Validate remaining characters
        if (!SAFE_FILENAME_PATTERN.matcher(baseName).matches()) {
            // Replace unsafe characters with underscores
            baseName = baseName.replaceAll("[^a-zA-Z0-9가-힣._\\- ]", "_");
        }

        // Limit filename length
        if (baseName.length() > 255) {
            String extension = extractExtension(baseName);
            int maxNameLength = 255 - extension.length() - 1;
            baseName = baseName.substring(0, maxNameLength) + "." + extension;
        }

        return baseName.trim();
    }

    /**
     * Checks if the byte array starts with the given prefix.
     */
    private boolean startsWith(byte[] array, byte[] prefix) {
        if (array.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (array[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the set of allowed file extensions.
     *
     * @return immutable set of allowed extensions
     */
    public Set<String> getAllowedExtensions() {
        return ALLOWED_EXTENSIONS;
    }

    /**
     * Returns the maximum allowed file size in bytes.
     *
     * @return max file size
     */
    public long getMaxFileSize() {
        return MAX_FILE_SIZE;
    }

    /**
     * Result of file validation containing sanitized filename and metadata.
     */
    public record ValidationResult(
            String sanitizedFilename,
            String extension,
            long fileSize
    ) {
    }
}
