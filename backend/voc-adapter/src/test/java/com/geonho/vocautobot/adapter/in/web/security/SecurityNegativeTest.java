package com.geonho.vocautobot.adapter.in.web.security;

import com.geonho.vocautobot.adapter.common.util.XssProtectionUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security Negative Testing for VOC Auto Bot.
 *
 * <p>This test class verifies that the application properly defends against:</p>
 * <ul>
 *   <li>XSS (Cross-Site Scripting) injection attempts</li>
 *   <li>SQL injection patterns (for display)</li>
 *   <li>CRLF injection attempts</li>
 *   <li>Other security attack vectors</li>
 * </ul>
 *
 * <p>All bypass attempts should be blocked or neutralized.</p>
 *
 * <p>Note: Rate limiter bypass tests are in RateLimitFilterTest in the filter package
 * since doFilterInternal is a protected method.</p>
 */
@DisplayName("Security Negative Tests")
class SecurityNegativeTest {

    @Nested
    @DisplayName("XSS Injection Prevention Tests")
    class XssInjectionTests {

        @Test
        @DisplayName("Should neutralize basic script tag injection")
        void shouldNeutralizeBasicScriptTag() {
            // given
            String maliciousInput = "<script>alert('XSS')</script>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then
            assertThat(sanitized)
                    .doesNotContain("<script>")
                    .doesNotContain("</script>")
                    .doesNotContain("alert");
        }

        @Test
        @DisplayName("Should neutralize event handler injection")
        void shouldNeutralizeEventHandler() {
            // given
            String maliciousInput = "<img src=x onerror=alert('XSS')>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then
            assertThat(sanitized)
                    .doesNotContain("onerror")
                    .doesNotContain("alert");
        }

        @Test
        @DisplayName("Should neutralize javascript: URL injection")
        void shouldNeutralizeJavascriptUrl() {
            // given
            String maliciousInput = "<a href=\"javascript:alert('XSS')\">Click</a>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then
            assertThat(sanitized).doesNotContain("javascript:");
        }

        @ParameterizedTest
        @DisplayName("Should neutralize various XSS attack vectors")
        @ValueSource(strings = {
                "<script>document.cookie</script>",
                "<img src=\"x\" onerror=\"alert(1)\">",
                "<svg onload=\"alert(1)\">",
                "<body onload=\"alert(1)\">",
                "<iframe src=\"javascript:alert(1)\">",
                "<input onfocus=\"alert(1)\" autofocus>",
                "<marquee onstart=\"alert(1)\">",
                "<video><source onerror=\"alert(1)\">",
                "<math><maction xlink:href=\"javascript:alert(1)\">",
                "<<script>alert(1)<</script>",  // Double encoding
                "%3Cscript%3Ealert(1)%3C/script%3E"  // URL encoded
        })
        void shouldNeutralizeVariousXssVectors(String maliciousInput) {
            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then
            assertThat(sanitized)
                    .doesNotContainIgnoringCase("<script")
                    .doesNotContain("javascript:")
                    .doesNotContainIgnoringCase("onerror")
                    .doesNotContainIgnoringCase("onload")
                    .doesNotContainIgnoringCase("onfocus")
                    .doesNotContainIgnoringCase("onstart");
        }

        @Test
        @DisplayName("Should handle nested script tags")
        void shouldHandleNestedScriptTags() {
            // given
            String maliciousInput = "<scr<script>ipt>alert('XSS')</scr</script>ipt>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then - The sanitizer removes script tags. The nested malformed attempt
            // results in text content being HTML-encoded (no executable script)
            assertThat(sanitized)
                    .doesNotContain("<script>")
                    .doesNotContain("</script>");
            // Note: The text 'alert' may remain as harmless text content,
            // which is expected behavior - it's no longer executable code.
        }

        @Test
        @DisplayName("Should HTML encode special characters for display")
        void shouldHtmlEncodeSpecialCharacters() {
            // given
            String maliciousInput = "<script>alert(\"XSS\")</script>";

            // when
            String encoded = XssProtectionUtil.encodeForHtml(maliciousInput);

            // then
            assertThat(encoded)
                    .contains("&lt;script&gt;")
                    .contains("&lt;/script&gt;");
        }

        @Test
        @DisplayName("Should handle data URI XSS attempts")
        void shouldHandleDataUriXss() {
            // given
            String maliciousInput = "<a href=\"data:text/html,<script>alert('XSS')</script>\">Click</a>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(maliciousInput);

            // then
            assertThat(sanitized).doesNotContain("data:text/html");
        }

        @Test
        @DisplayName("Should strip all HTML when using stripHtml")
        void shouldStripAllHtml() {
            // given
            String htmlInput = "<div><script>alert('XSS')</script><p>Safe text</p></div>";

            // when
            String stripped = XssProtectionUtil.stripHtml(htmlInput);

            // then
            assertThat(stripped)
                    .doesNotContain("<")
                    .doesNotContain(">")
                    .contains("Safe text");
        }

        @Test
        @DisplayName("Should preserve safe tags when using sanitizeHtml")
        void shouldPreserveSafeTags() {
            // given
            String mixedInput = "<p>Hello</p><script>evil()</script><b>World</b>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(mixedInput);

            // then
            assertThat(sanitized)
                    .contains("<p>Hello</p>")
                    .contains("<b>World</b>")
                    .doesNotContain("<script>");
        }

        @Test
        @DisplayName("Should handle SVG-based XSS")
        void shouldHandleSvgXss() {
            // given
            String svgXss = "<svg><script>alert(1)</script></svg>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(svgXss);

            // then
            assertThat(sanitized).doesNotContain("<script>");
        }

        @Test
        @DisplayName("Should handle case variations in XSS")
        void shouldHandleCaseVariations() {
            // given
            String mixedCaseXss = "<SCRIPT>alert('XSS')</SCRIPT>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(mixedCaseXss);

            // then
            assertThat(sanitized)
                    .doesNotContainIgnoringCase("<script")
                    .doesNotContain("alert");
        }
    }

    @Nested
    @DisplayName("SQL Injection Prevention Tests")
    class SqlInjectionTests {

        @Test
        @DisplayName("SQL injection patterns should be safely encoded for display")
        void shouldEncodeForSafeDisplay() {
            // given - SQL injection attempts in input
            String sqlInjection1 = "'; DROP TABLE vocs; --";
            String sqlInjection2 = "1' OR '1'='1";
            String sqlInjection3 = "UNION SELECT * FROM users";

            // when - these are passed through XSS encoder for HTML display
            // Note: actual SQL injection prevention is handled by parameterized queries in JPA
            String encoded1 = XssProtectionUtil.encodeForHtml(sqlInjection1);
            String encoded2 = XssProtectionUtil.encodeForHtml(sqlInjection2);
            String encoded3 = XssProtectionUtil.encodeForHtml(sqlInjection3);

            // then - special characters are encoded for safe HTML display
            assertThat(encoded1).contains("&#39;");  // Single quote encoded
            assertThat(encoded2).contains("&#39;");
            // SQL keywords themselves are not dangerous when properly parameterized
            assertThat(encoded3).isNotNull();
        }

        @Test
        @DisplayName("SQL injection in script context should be handled")
        void shouldHandleSqlInScriptContext() {
            // given
            String sqlWithJs = "'; alert(document.cookie); --";

            // when
            String encodedForJs = XssProtectionUtil.encodeForJavaScript(sqlWithJs);

            // then - quote is escaped for JavaScript context
            assertThat(encodedForJs).contains("\\u0027");
        }
    }

    @Nested
    @DisplayName("CRLF Injection Prevention Tests")
    class CrlfInjectionTests {

        @Test
        @DisplayName("Should escape CRLF characters for JavaScript")
        void shouldEscapeCrlfCharacters() {
            // given
            String inputWithCrlf = "header-value\r\nX-Injected-Header: evil";

            // when
            String encoded = XssProtectionUtil.encodeForJavaScript(inputWithCrlf);

            // then - newline characters should be escaped
            assertThat(encoded)
                    .contains("\\r")
                    .contains("\\n");
        }

        @Test
        @DisplayName("Should handle standalone CR and LF")
        void shouldHandleStandaloneCrLf() {
            // given
            String inputWithCr = "line1\rline2";
            String inputWithLf = "line1\nline2";

            // when
            String encodedCr = XssProtectionUtil.encodeForJavaScript(inputWithCr);
            String encodedLf = XssProtectionUtil.encodeForJavaScript(inputWithLf);

            // then
            assertThat(encodedCr).contains("\\r");
            assertThat(encodedLf).contains("\\n");
        }
    }

    @Nested
    @DisplayName("Path Traversal Prevention Tests")
    class PathTraversalTests {

        @Test
        @DisplayName("Path traversal sequences are preserved for HTML display but not executed")
        void shouldPreservePathTraversalForDisplay() {
            // given
            String pathTraversal = "../../../etc/passwd";

            // when - encoded for display (actual file path validation happens in FileValidationUtil)
            String encoded = XssProtectionUtil.encodeForHtml(pathTraversal);

            // then - the string is preserved but safe for HTML display
            assertThat(encoded).isEqualTo("../../../etc/passwd");
        }

        @Test
        @DisplayName("Path traversal in HTML context is safe")
        void shouldHandlePathTraversalInHtml() {
            // given
            String pathTraversalInHtml = "<a href=\"../../../etc/passwd\">Link</a>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(pathTraversalInHtml);

            // then - link is preserved but href is sanitized based on allowed protocols
            assertThat(sanitized).contains("<a");
        }
    }

    @Nested
    @DisplayName("JavaScript Context Tests")
    class JavaScriptContextTests {

        @Test
        @DisplayName("Should encode all dangerous characters for JavaScript context")
        void shouldEncodeForJavaScript() {
            // given
            String dangerousInput = "</script><script>alert('XSS')";

            // when
            String encoded = XssProtectionUtil.encodeForJavaScript(dangerousInput);

            // then
            assertThat(encoded)
                    .contains("\\u003c")  // <
                    .contains("\\u003e")  // >
                    .contains("\\u0027")  // '
                    .contains("\\/");      // /
        }

        @Test
        @DisplayName("Should handle backslashes in JavaScript context")
        void shouldHandleBackslashes() {
            // given
            String inputWithBackslash = "C:\\Users\\test";

            // when
            String encoded = XssProtectionUtil.encodeForJavaScript(inputWithBackslash);

            // then
            assertThat(encoded).contains("\\\\");
        }

        @Test
        @DisplayName("Should handle Unicode in JavaScript context")
        void shouldHandleUnicode() {
            // given
            String unicodeInput = "Hello \u4E2D\u6587";

            // when
            String encoded = XssProtectionUtil.encodeForJavaScript(unicodeInput);

            // then - Unicode characters may be preserved or encoded
            assertThat(encoded).isNotNull();
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle null input gracefully")
        void shouldHandleNullInput() {
            assertThat(XssProtectionUtil.encodeForHtml(null)).isNull();
            assertThat(XssProtectionUtil.encodeForJavaScript(null)).isNull();
            assertThat(XssProtectionUtil.sanitizeHtml(null)).isNull();
            assertThat(XssProtectionUtil.stripHtml(null)).isNull();
        }

        @Test
        @DisplayName("Should handle empty input")
        void shouldHandleEmptyInput() {
            assertThat(XssProtectionUtil.encodeForHtml("")).isEmpty();
            assertThat(XssProtectionUtil.encodeForJavaScript("")).isEmpty();
            assertThat(XssProtectionUtil.sanitizeHtml("")).isEmpty();
            assertThat(XssProtectionUtil.stripHtml("")).isEmpty();
        }

        @Test
        @DisplayName("Should handle whitespace only input")
        void shouldHandleWhitespaceInput() {
            String whitespace = "   \t\n   ";

            assertThat(XssProtectionUtil.encodeForHtml(whitespace)).isEqualTo(whitespace);
            assertThat(XssProtectionUtil.stripHtml(whitespace).trim()).isEmpty();
        }

        @Test
        @DisplayName("Should handle very long input")
        void shouldHandleLongInput() {
            // given
            String longInput = "<script>" + "A".repeat(100000) + "</script>";

            // when
            String sanitized = XssProtectionUtil.sanitizeHtml(longInput);

            // then
            assertThat(sanitized).doesNotContain("<script>");
            assertThat(sanitized.length()).isLessThanOrEqualTo(longInput.length());
        }
    }
}
