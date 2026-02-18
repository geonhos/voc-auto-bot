package com.geonho.vocautobot.adapter.config;

import com.geonho.vocautobot.adapter.in.filter.RateLimitFilter;
import com.geonho.vocautobot.adapter.in.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${security.enabled:true}")
    private boolean securityEnabled;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;

    /**
     * Allowed CORS origins from configuration.
     * SECURITY: Must be configured via environment variable CORS_ALLOWED_ORIGINS.
     * Example: http://localhost:3000,https://app.example.com
     */
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @PostConstruct
    public void logSecurityStatus() {
        if (!securityEnabled) {
            log.warn("========================================");
            log.warn("WARNING: Security is DISABLED!");
            log.warn("This should only be used for development.");
            log.warn("NEVER use SECURITY_ENABLED=false in production!");
            log.warn("========================================");
        }
    }

    /**
     * Development-only filter chain that permits all requests without authentication.
     * Only active when security.enabled=false.
     *
     * WARNING: NEVER use this in production environments!
     */
    @Bean
    @Order(1)
    @ConditionalOnProperty(name = "security.enabled", havingValue = "false")
    public SecurityFilterChain permitAllFilterChain(HttpSecurity http) throws Exception {
        log.warn("Loading PERMIT-ALL security filter chain - authentication disabled!");
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    @ConditionalOnProperty(name = "security.enabled", havingValue = "true", matchIfMissing = true)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Security headers
                .headers(headers -> headers
                        // Content Security Policy
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'self'; " +
                                        "script-src 'self'; " +
                                        "style-src 'self' 'unsafe-inline'; " +
                                        "img-src 'self' data: https:; " +
                                        "font-src 'self'; " +
                                        "connect-src 'self'; " +
                                        "frame-ancestors 'none'; " +
                                        "form-action 'self'; " +
                                        "base-uri 'self'"
                                )
                        )
                        // X-Content-Type-Options
                        .contentTypeOptions(contentTypeOptions -> {})
                        // X-Frame-Options
                        .frameOptions(frameOptions -> frameOptions.deny())
                        // X-XSS-Protection (legacy but still useful)
                        .xssProtection(xss -> xss.headerValue(
                                org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK
                        ))
                        // Referrer-Policy
                        .referrerPolicy(referrer -> referrer
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                        )
                        // Permissions-Policy
                        .permissionsPolicy(permissions -> permissions
                                .policy("geolocation=(), microphone=(), camera=()")
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        // Error page must be accessible to return proper error responses
                        .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()
                        // Public authentication endpoints
                        .requestMatchers(
                                new AntPathRequestMatcher("/v1/auth/**")
                        ).permitAll()
                        // Public VOC endpoints
                        .requestMatchers(
                                new AntPathRequestMatcher("/v1/public/**")
                        ).permitAll()
                        // Swagger/OpenAPI - public for development
                        .requestMatchers(
                                new AntPathRequestMatcher("/swagger-ui/**"),
                                new AntPathRequestMatcher("/swagger-ui.html"),
                                new AntPathRequestMatcher("/api-docs/**"),
                                new AntPathRequestMatcher("/v3/api-docs/**")
                        ).permitAll()
                        // Actuator endpoints security
                        .requestMatchers(
                                new AntPathRequestMatcher("/actuator/health"),
                                new AntPathRequestMatcher("/actuator/health/**"),
                                new AntPathRequestMatcher("/actuator/info")
                        ).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/actuator/**")).hasRole("ADMIN")
                        // Role-based access for management endpoints
                        .requestMatchers(new AntPathRequestMatcher("/v1/admin/**")).hasRole("ADMIN")
                        .requestMatchers(new AntPathRequestMatcher("/v1/users/**")).hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(new AntPathRequestMatcher("/v1/categories/**")).hasAnyRole("ADMIN", "MANAGER")
                        // SSE stream endpoint (requires auth but needs special handling)
                        .requestMatchers(new AntPathRequestMatcher("/v1/notifications/stream")).authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                // JWT authentication filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Rate limit filter runs before JWT authentication to protect against brute force
                .addFilterBefore(rateLimitFilter, jwtAuthenticationFilter.getClass());

        return http.build();
    }

    /**
     * Configures CORS with allowed origins from environment configuration.
     * <p>
     * SECURITY NOTES:
     * - Wildcard "*" origins are NOT allowed as they pose a security risk
     * - Origins must be explicitly configured via CORS_ALLOWED_ORIGINS environment variable
     * - Credentials are enabled for authenticated requests
     * </p>
     *
     * @return configured CORS source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse and validate allowed origins (no wildcards allowed)
        List<String> origins = parseAllowedOrigins(allowedOrigins);
        configuration.setAllowedOrigins(origins);

        // Allowed HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allowed headers - specific headers for security
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // Expose headers that the client can access
        configuration.setExposedHeaders(List.of(
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "Retry-After",
                "Set-Cookie"
        ));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Parses and validates allowed origins string.
     * Rejects wildcard "*" as it's a security risk.
     *
     * @param originsString comma-separated origins
     * @return list of validated origins
     * @throws IllegalArgumentException if wildcard is detected
     */
    private List<String> parseAllowedOrigins(String originsString) {
        if (originsString == null || originsString.isBlank()) {
            return List.of("http://localhost:3000");
        }

        List<String> origins = Arrays.stream(originsString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Validate no wildcards
        for (String origin : origins) {
            if ("*".equals(origin)) {
                throw new IllegalArgumentException(
                        "SECURITY: Wildcard '*' is not allowed in CORS origins. " +
                        "Please configure explicit origins via CORS_ALLOWED_ORIGINS"
                );
            }
        }

        return origins;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
