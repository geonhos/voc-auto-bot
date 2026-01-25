package com.geonho.vocautobot.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${spring.application.name:VOC Auto Bot}")
    private String applicationName;

    @Bean
    public OpenAPI openAPI() {
        String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development"),
                        new Server().url("https://api.voc-auto-bot.com").description("Production")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT 토큰을 입력하세요. 'Bearer ' 접두사는 자동으로 추가됩니다.")
                        )
                );
    }

    private Info apiInfo() {
        return new Info()
                .title(applicationName + " API")
                .description("""
                        VOC(Voice of Customer) 자동화 시스템 API

                        ## 주요 기능
                        - VOC 접수 및 관리
                        - AI 기반 VOC 분석 (카테고리 자동 분류, 유사 VOC 검색)
                        - 이메일 발송 및 템플릿 관리
                        - 통계 및 대시보드

                        ## 인증
                        대부분의 API는 JWT 인증이 필요합니다. `/api/v1/auth/login`으로 로그인 후
                        발급받은 토큰을 Authorization 헤더에 포함하세요.
                        """)
                .version("1.0.0")
                .contact(new Contact()
                        .name("VOC Auto Bot Team")
                        .email("support@voc-auto-bot.com")
                )
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT")
                );
    }
}
