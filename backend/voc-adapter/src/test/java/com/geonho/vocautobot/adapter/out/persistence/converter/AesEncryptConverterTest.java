package com.geonho.vocautobot.adapter.out.persistence.converter;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class AesEncryptConverterTest {

    private static AesEncryptConverter converter;

    @BeforeAll
    static void setUp() {
        converter = new AesEncryptConverter();
        // 32 bytes = 64 hex chars for AES-256
        converter.setSecretKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    }

    @Test
    void shouldEncryptAndDecrypt() {
        String original = "test@example.com";
        String encrypted = converter.convertToDatabaseColumn(original);
        String decrypted = converter.convertToEntityAttribute(encrypted);

        assertThat(decrypted).isEqualTo(original);
        assertThat(encrypted).isNotEqualTo(original);
    }

    @Test
    void shouldHandleNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void shouldProduceDifferentCiphertexts() {
        String original = "test@example.com";
        String encrypted1 = converter.convertToDatabaseColumn(original);
        String encrypted2 = converter.convertToDatabaseColumn(original);

        // Different IVs should produce different ciphertexts
        assertThat(encrypted1).isNotEqualTo(encrypted2);
    }

    @Test
    void shouldHandleKoreanText() {
        String original = "홍길동";
        String encrypted = converter.convertToDatabaseColumn(original);
        String decrypted = converter.convertToEntityAttribute(encrypted);

        assertThat(decrypted).isEqualTo(original);
    }
}
