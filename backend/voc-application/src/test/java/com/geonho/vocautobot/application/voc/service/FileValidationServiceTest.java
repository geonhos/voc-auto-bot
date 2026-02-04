package com.geonho.vocautobot.application.voc.service;

import com.geonho.vocautobot.application.voc.exception.FileValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.*;

@DisplayName("FileValidationService Tests")
class FileValidationServiceTest {

    private FileValidationService fileValidationService;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService();
    }

    @Nested
    @DisplayName("Extension Validation")
    class ExtensionValidationTests {

        @ParameterizedTest
        @ValueSource(strings = {"pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "xls", "xlsx"})
        @DisplayName("should accept allowed extensions")
        void shouldAcceptAllowedExtensions(String extension) {
            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateExtension(extension));
        }

        @ParameterizedTest
        @ValueSource(strings = {"exe", "bat", "sh", "cmd", "ps1", "php", "jsp", "html", "js"})
        @DisplayName("should reject dangerous extensions")
        void shouldRejectDangerousExtensions(String extension) {
            assertThatThrownBy(() -> fileValidationService.validateExtension(extension))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("not allowed");
        }

        @Test
        @DisplayName("should reject null extension")
        void shouldRejectNullExtension() {
            assertThatThrownBy(() -> fileValidationService.validateExtension(null))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("must have an extension");
        }

        @Test
        @DisplayName("should reject empty extension")
        void shouldRejectEmptyExtension() {
            assertThatThrownBy(() -> fileValidationService.validateExtension(""))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("must have an extension");
        }

        @Test
        @DisplayName("should be case insensitive")
        void shouldBeCaseInsensitive() {
            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateExtension("PDF"));
            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateExtension("Pdf"));
        }
    }

    @Nested
    @DisplayName("File Size Validation")
    class FileSizeValidationTests {

        @Test
        @DisplayName("should accept file within size limit")
        void shouldAcceptFileWithinLimit() {
            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateFileSize(5 * 1024 * 1024)); // 5MB
        }

        @Test
        @DisplayName("should accept file at size limit")
        void shouldAcceptFileAtLimit() {
            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateFileSize(FileValidationService.MAX_FILE_SIZE));
        }

        @Test
        @DisplayName("should reject file exceeding size limit")
        void shouldRejectFileExceedingLimit() {
            long oversizeFile = FileValidationService.MAX_FILE_SIZE + 1;
            assertThatThrownBy(() -> fileValidationService.validateFileSize(oversizeFile))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("exceeds maximum limit");
        }

        @Test
        @DisplayName("should reject empty file")
        void shouldRejectEmptyFile() {
            assertThatThrownBy(() -> fileValidationService.validateFileSize(0))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("empty");
        }

        @Test
        @DisplayName("should reject negative file size")
        void shouldRejectNegativeFileSize() {
            assertThatThrownBy(() -> fileValidationService.validateFileSize(-1))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("empty");
        }
    }

    @Nested
    @DisplayName("Magic Bytes Validation")
    class MagicBytesValidationTests {

        @Test
        @DisplayName("should validate PDF magic bytes")
        void shouldValidatePdfMagicBytes() throws IOException {
            // PDF magic bytes: %PDF
            byte[] pdfHeader = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
            InputStream stream = new ByteArrayInputStream(pdfHeader);

            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateMagicBytes(stream, "pdf"));
        }

        @Test
        @DisplayName("should validate PNG magic bytes")
        void shouldValidatePngMagicBytes() throws IOException {
            // PNG magic bytes
            byte[] pngHeader = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
            InputStream stream = new ByteArrayInputStream(pngHeader);

            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateMagicBytes(stream, "png"));
        }

        @Test
        @DisplayName("should validate JPEG magic bytes")
        void shouldValidateJpegMagicBytes() throws IOException {
            // JPEG magic bytes
            byte[] jpegHeader = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46};
            InputStream stream = new ByteArrayInputStream(jpegHeader);

            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateMagicBytes(stream, "jpg"));
        }

        @Test
        @DisplayName("should validate GIF magic bytes")
        void shouldValidateGifMagicBytes() throws IOException {
            // GIF magic bytes: GIF89a
            byte[] gifHeader = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00};
            InputStream stream = new ByteArrayInputStream(gifHeader);

            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateMagicBytes(stream, "gif"));
        }

        @Test
        @DisplayName("should validate DOCX/XLSX (ZIP-based) magic bytes")
        void shouldValidateDocxMagicBytes() throws IOException {
            // DOCX/XLSX magic bytes (PK..)
            byte[] zipHeader = {0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00};
            InputStream stream = new ByteArrayInputStream(zipHeader);

            assertThatNoException()
                    .isThrownBy(() -> fileValidationService.validateMagicBytes(stream, "docx"));
        }

        @Test
        @DisplayName("should reject mismatched magic bytes")
        void shouldRejectMismatchedMagicBytes() {
            // PNG content but claiming to be PDF
            byte[] pngHeader = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
            InputStream stream = new ByteArrayInputStream(pngHeader);

            assertThatThrownBy(() -> fileValidationService.validateMagicBytes(stream, "pdf"))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("does not match");
        }

        @Test
        @DisplayName("should reject file too small to validate")
        void shouldRejectFileTooSmall() {
            byte[] tooSmall = {0x50, 0x4B}; // Only 2 bytes
            InputStream stream = new ByteArrayInputStream(tooSmall);

            assertThatThrownBy(() -> fileValidationService.validateMagicBytes(stream, "docx"))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("too small");
        }

        @Test
        @DisplayName("should reject null input stream")
        void shouldRejectNullInputStream() {
            assertThatThrownBy(() -> fileValidationService.validateMagicBytes(null, "pdf"))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("required");
        }
    }

    @Nested
    @DisplayName("Filename Sanitization")
    class FilenameSanitizationTests {

        @Test
        @DisplayName("should preserve safe filename")
        void shouldPreserveSafeFilename() {
            String filename = "document.pdf";
            String result = fileValidationService.sanitizeFilename(filename);
            assertThat(result).isEqualTo("document.pdf");
        }

        @Test
        @DisplayName("should preserve Korean characters in filename")
        void shouldPreserveKoreanCharacters() {
            String filename = "문서_파일.pdf";
            String result = fileValidationService.sanitizeFilename(filename);
            assertThat(result).isEqualTo("문서_파일.pdf");
        }

        @Test
        @DisplayName("should remove path traversal sequences")
        void shouldRemovePathTraversal() {
            assertThatThrownBy(() -> fileValidationService.sanitizeFilename("../../../etc/passwd"))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("invalid");
        }

        @Test
        @DisplayName("should extract filename from full path")
        void shouldExtractFilename() {
            String result = fileValidationService.sanitizeFilename("/path/to/document.pdf");
            assertThat(result).isEqualTo("document.pdf");
        }

        @Test
        @DisplayName("should handle Windows path separators")
        void shouldHandleWindowsPaths() {
            String result = fileValidationService.sanitizeFilename("C:\\Users\\test\\document.pdf");
            assertThat(result).isEqualTo("document.pdf");
        }

        @ParameterizedTest
        @ValueSource(strings = {"con", "prn", "aux", "nul", "com1", "lpt1"})
        @DisplayName("should reject Windows reserved names")
        void shouldRejectWindowsReservedNames(String reserved) {
            assertThatThrownBy(() -> fileValidationService.sanitizeFilename(reserved + ".txt"))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("invalid");
        }

        @Test
        @DisplayName("should reject null filename")
        void shouldRejectNullFilename() {
            assertThatThrownBy(() -> fileValidationService.sanitizeFilename(null))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("empty");
        }

        @Test
        @DisplayName("should replace unsafe characters")
        void shouldReplaceUnsafeCharacters() {
            String result = fileValidationService.sanitizeFilename("file@#$%.pdf");
            assertThat(result).doesNotContain("@").doesNotContain("#").doesNotContain("$");
            assertThat(result).endsWith(".pdf");
        }

        @Test
        @DisplayName("should trim whitespace")
        void shouldTrimWhitespace() {
            String result = fileValidationService.sanitizeFilename("  document.pdf  ");
            assertThat(result).isEqualTo("document.pdf");
        }
    }

    @Nested
    @DisplayName("Extract Extension")
    class ExtractExtensionTests {

        @Test
        @DisplayName("should extract simple extension")
        void shouldExtractSimpleExtension() {
            String result = fileValidationService.extractExtension("document.pdf");
            assertThat(result).isEqualTo("pdf");
        }

        @Test
        @DisplayName("should handle multiple dots")
        void shouldHandleMultipleDots() {
            String result = fileValidationService.extractExtension("file.name.with.dots.pdf");
            assertThat(result).isEqualTo("pdf");
        }

        @Test
        @DisplayName("should return empty for no extension")
        void shouldReturnEmptyForNoExtension() {
            String result = fileValidationService.extractExtension("noextension");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return empty for dot at start")
        void shouldReturnEmptyForDotAtStart() {
            String result = fileValidationService.extractExtension(".hidden");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return empty for null")
        void shouldReturnEmptyForNull() {
            String result = fileValidationService.extractExtension(null);
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return lowercase extension")
        void shouldReturnLowercaseExtension() {
            String result = fileValidationService.extractExtension("document.PDF");
            assertThat(result).isEqualTo("pdf");
        }
    }

    @Nested
    @DisplayName("Full Validation")
    class FullValidationTests {

        @Test
        @DisplayName("should validate complete PDF file")
        void shouldValidateCompletePdfFile() {
            String filename = "document.pdf";
            long fileSize = 1024 * 1024; // 1MB
            byte[] pdfHeader = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
            InputStream stream = new ByteArrayInputStream(pdfHeader);

            FileValidationService.ValidationResult result =
                    fileValidationService.validate(filename, fileSize, stream);

            assertThat(result.sanitizedFilename()).isEqualTo("document.pdf");
            assertThat(result.extension()).isEqualTo("pdf");
            assertThat(result.fileSize()).isEqualTo(fileSize);
        }

        @Test
        @DisplayName("should reject file with mismatched content")
        void shouldRejectMismatchedContent() {
            String filename = "document.pdf";
            long fileSize = 1024;
            // PNG content but claiming to be PDF
            byte[] pngHeader = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
            InputStream stream = new ByteArrayInputStream(pngHeader);

            assertThatThrownBy(() -> fileValidationService.validate(filename, fileSize, stream))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("does not match");
        }

        @Test
        @DisplayName("should reject oversized file")
        void shouldRejectOversizedFile() {
            String filename = "large.pdf";
            long fileSize = FileValidationService.MAX_FILE_SIZE + 1;
            byte[] pdfHeader = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
            InputStream stream = new ByteArrayInputStream(pdfHeader);

            assertThatThrownBy(() -> fileValidationService.validate(filename, fileSize, stream))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("exceeds");
        }

        @Test
        @DisplayName("should reject file with dangerous extension")
        void shouldRejectDangerousExtension() {
            String filename = "malware.exe";
            long fileSize = 1024;
            byte[] content = {0x4D, 0x5A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00}; // MZ header
            InputStream stream = new ByteArrayInputStream(content);

            assertThatThrownBy(() -> fileValidationService.validate(filename, fileSize, stream))
                    .isInstanceOf(FileValidationException.class)
                    .hasMessageContaining("not allowed");
        }
    }
}
