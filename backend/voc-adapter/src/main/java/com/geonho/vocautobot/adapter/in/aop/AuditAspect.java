package com.geonho.vocautobot.adapter.in.aop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.in.security.SecurityUser;
import com.geonho.vocautobot.application.audit.Audited;
import com.geonho.vocautobot.application.audit.port.out.SaveAuditLogPort;
import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Set;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password", "token", "secret", "accessToken", "refreshToken",
            "currentPassword", "newPassword", "confirmPassword"
    );

    private final SaveAuditLogPort saveAuditLogPort;
    private final ObjectMapper objectMapper;

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Object result = joinPoint.proceed();

        try {
            AuditAction action = AuditAction.valueOf(audited.action());
            AuditEntityType entityType = AuditEntityType.valueOf(audited.entityType());

            Long userId = null;
            String username = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof SecurityUser securityUser) {
                userId = securityUser.getUserId();
                username = securityUser.getUsername();
            }

            String ipAddress = null;
            String userAgent = null;
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = extractClientIp(request);
                userAgent = request.getHeader("User-Agent");
            }

            String entityId = extractEntityId(result);
            String afterData = serializeResult(result);

            AuditLog auditLog = AuditLog.create(
                    userId,
                    username,
                    action,
                    entityType,
                    entityId,
                    null,
                    afterData,
                    ipAddress,
                    userAgent
            );

            saveAuditLogAsync(auditLog);
        } catch (Exception e) {
            log.warn("Failed to save audit log for method {}: {}", joinPoint.getSignature().getName(), e.getMessage());
        }

        return result;
    }

    @Async
    protected void saveAuditLogAsync(AuditLog auditLog) {
        try {
            saveAuditLogPort.save(auditLog);
        } catch (Exception e) {
            log.error("Async audit log save failed: {}", e.getMessage());
        }
    }

    private String extractEntityId(Object result) {
        if (result == null) return null;

        try {
            var getIdMethod = result.getClass().getMethod("getId");
            Object id = getIdMethod.invoke(result);
            return id != null ? id.toString() : null;
        } catch (NoSuchMethodException e) {
            // Try getTicketId for VOC domain
            try {
                var getTicketIdMethod = result.getClass().getMethod("getTicketId");
                Object ticketId = getTicketIdMethod.invoke(result);
                return ticketId != null ? ticketId.toString() : null;
            } catch (Exception ignored) {
                return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String serializeResult(Object result) {
        if (result == null) return null;
        try {
            String json = objectMapper.writeValueAsString(result);
            // Mask sensitive fields
            var map = objectMapper.readValue(json, java.util.Map.class);
            maskSensitiveFields(map);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.debug("Failed to serialize audit data: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private void maskSensitiveFields(java.util.Map<String, Object> map) {
        for (String key : map.keySet()) {
            Object value = map.get(key);
            if (SENSITIVE_FIELDS.contains(key)) {
                map.put(key, "***MASKED***");
            } else if (value instanceof java.util.Map) {
                maskSensitiveFields((java.util.Map<String, Object>) value);
            }
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
