package com.geonho.vocautobot.domain.voc;

/**
 * VOC domain constants.
 * Centralizes magic numbers and configuration values for consistent validation.
 */
public final class VocConstants {

    private VocConstants() {
        // Utility class - prevent instantiation
    }

    // ========== Title Constraints ==========
    /**
     * Maximum length for VOC title
     */
    public static final int TITLE_MAX_LENGTH = 200;

    /**
     * Minimum length for VOC title
     */
    public static final int TITLE_MIN_LENGTH = 2;

    // ========== Content Constraints ==========
    /**
     * Maximum length for VOC content
     */
    public static final int CONTENT_MAX_LENGTH = 10000;

    /**
     * Minimum length for VOC content
     */
    public static final int CONTENT_MIN_LENGTH = 10;

    // ========== File Upload Constraints ==========
    /**
     * Maximum file size in bytes (10MB)
     */
    public static final long FILE_SIZE_LIMIT = 10L * 1024 * 1024;

    /**
     * Maximum file size in megabytes
     */
    public static final int FILE_SIZE_LIMIT_MB = 10;

    /**
     * Maximum number of files per VOC
     */
    public static final int MAX_FILES_PER_VOC = 5;

    // ========== Customer Info Constraints ==========
    /**
     * Maximum length for customer name
     */
    public static final int CUSTOMER_NAME_MAX_LENGTH = 100;

    /**
     * Maximum length for customer email
     */
    public static final int CUSTOMER_EMAIL_MAX_LENGTH = 100;

    /**
     * Maximum length for customer phone
     */
    public static final int CUSTOMER_PHONE_MAX_LENGTH = 20;

    // ========== Memo Constraints ==========
    /**
     * Maximum length for memo content
     */
    public static final int MEMO_MAX_LENGTH = 2000;

    // ========== Ticket ID Constraints ==========
    /**
     * Maximum retry attempts for generating unique ticket ID
     */
    public static final int MAX_TICKET_ID_RETRIES = 10;

    /**
     * Ticket ID prefix format
     */
    public static final String TICKET_ID_PREFIX = "VOC-";
}
