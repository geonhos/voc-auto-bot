package com.geonho.vocautobot.application.voc.exception;

/**
 * Exception thrown when file validation fails.
 *
 * <p>This exception is used to indicate that an uploaded file has failed
 * security validation checks such as:
 * <ul>
 *   <li>Invalid or disallowed file extension</li>
 *   <li>File content does not match declared type (magic byte mismatch)</li>
 *   <li>File size exceeds maximum limit</li>
 *   <li>Invalid or dangerous filename</li>
 * </ul>
 */
public class FileValidationException extends RuntimeException {

    public FileValidationException(String message) {
        super(message);
    }

    public FileValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
