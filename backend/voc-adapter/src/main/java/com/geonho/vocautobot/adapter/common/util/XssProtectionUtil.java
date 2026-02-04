package com.geonho.vocautobot.adapter.common.util;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.web.util.HtmlUtils;

/**
 * Utility class for XSS (Cross-Site Scripting) protection.
 *
 * <p>This class provides methods for encoding and sanitizing user input to prevent XSS attacks.
 * It follows the OWASP XSS Prevention Cheat Sheet recommendations.</p>
 *
 * <h3>Strategy:</h3>
 * <ul>
 *   <li><b>Output Encoding (Preferred)</b>: Use {@link #encodeForHtml(String)} for plain text fields.
 *       This is the safest approach as it encodes all potentially dangerous characters.</li>
 *   <li><b>HTML Sanitization</b>: Use {@link #sanitizeHtml(String)} for rich text fields where
 *       some HTML formatting is needed. This removes dangerous elements while preserving safe ones.</li>
 * </ul>
 *
 * @see <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html">OWASP XSS Prevention Cheat Sheet</a>
 */
public final class XssProtectionUtil {

    /**
     * OWASP HTML Sanitizer policy for rich text content.
     * Allows basic formatting (bold, italic, links, blocks) but removes scripts and dangerous elements.
     */
    private static final PolicyFactory SAFE_HTML_POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.BLOCKS)
            .and(Sanitizers.TABLES)
            .and(Sanitizers.IMAGES);

    private XssProtectionUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Encodes a string for safe HTML output using output encoding.
     * This is the PREFERRED method for plain text fields.
     *
     * <p>Converts potentially dangerous characters to their HTML entity equivalents:
     * <ul>
     *   <li>{@code <} becomes {@code &lt;}</li>
     *   <li>{@code >} becomes {@code &gt;}</li>
     *   <li>{@code &} becomes {@code &amp;}</li>
     *   <li>{@code "} becomes {@code &quot;}</li>
     *   <li>{@code '} becomes {@code &#39;}</li>
     * </ul>
     *
     * @param input the raw input string (may contain HTML/scripts)
     * @return the HTML-encoded string safe for output, or null if input is null
     */
    public static String encodeForHtml(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(input);
    }

    /**
     * Encodes a string for safe use within JavaScript contexts.
     *
     * <p>This method escapes characters that could break out of JavaScript string literals
     * or inject malicious scripts. Use this when embedding user input in JavaScript code.</p>
     *
     * @param input the raw input string
     * @return the JavaScript-safe encoded string, or null if input is null
     */
    public static String encodeForJavaScript(String input) {
        if (input == null) {
            return null;
        }

        StringBuilder encoded = new StringBuilder(input.length() * 2);
        for (char c : input.toCharArray()) {
            switch (c) {
                case '<' -> encoded.append("\\u003c");
                case '>' -> encoded.append("\\u003e");
                case '\'' -> encoded.append("\\u0027");
                case '"' -> encoded.append("\\u0022");
                case '\\' -> encoded.append("\\\\");
                case '/' -> encoded.append("\\/");
                case '\n' -> encoded.append("\\n");
                case '\r' -> encoded.append("\\r");
                case '\t' -> encoded.append("\\t");
                default -> encoded.append(c);
            }
        }
        return encoded.toString();
    }

    /**
     * Sanitizes HTML content while preserving safe formatting.
     * Use this for rich text fields where HTML formatting is expected.
     *
     * <p>This method uses the OWASP Java HTML Sanitizer to remove dangerous elements
     * while preserving safe HTML like:</p>
     * <ul>
     *   <li>Formatting: {@code <b>}, {@code <i>}, {@code <u>}, {@code <strong>}, {@code <em>}</li>
     *   <li>Links: {@code <a href="...">} (with safe URL validation)</li>
     *   <li>Blocks: {@code <p>}, {@code <div>}, {@code <br>}, {@code <blockquote>}</li>
     *   <li>Tables: {@code <table>}, {@code <tr>}, {@code <td>}, {@code <th>}</li>
     *   <li>Images: {@code <img>} (with safe URL validation)</li>
     * </ul>
     *
     * <p>Dangerous elements like {@code <script>}, {@code <iframe>}, event handlers
     * ({@code onclick}, {@code onerror}, etc.) are removed.</p>
     *
     * @param input the raw HTML input
     * @return the sanitized HTML safe for output, or null if input is null
     */
    public static String sanitizeHtml(String input) {
        if (input == null) {
            return null;
        }
        return SAFE_HTML_POLICY.sanitize(input);
    }

    /**
     * Strips all HTML tags from the input, leaving only plain text.
     *
     * <p>Use this when you want to completely remove all HTML formatting
     * and keep only the text content.</p>
     *
     * @param input the raw HTML input
     * @return plain text with all HTML tags removed, or null if input is null
     */
    public static String stripHtml(String input) {
        if (input == null) {
            return null;
        }
        // Remove all HTML tags using regex (safe for this purpose since we're just stripping)
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
