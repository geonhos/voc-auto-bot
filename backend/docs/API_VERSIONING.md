# API Versioning Strategy

This document describes the API versioning strategy for the VOC Auto Bot backend API.

## Current Version

**API Version: v1**

All API endpoints are currently prefixed with `/v1/`, indicating the first major version of the API.

### Base URL Structure
```
https://{domain}/v1/{resource}
```

Examples:
- `POST /v1/auth/login` - Authentication
- `GET /v1/vocs` - List VOCs
- `POST /v1/vocs` - Create VOC
- `GET /v1/vocs/{id}` - Get VOC detail

## Versioning Approach

### URL Path Versioning

We use **URL path versioning** (e.g., `/v1/`, `/v2/`) for the following reasons:

1. **Explicit and Clear**: Version is immediately visible in the URL
2. **Easy Routing**: Simple to route requests to different service versions
3. **Cache-Friendly**: Different versions have different URLs, making caching straightforward
4. **API Gateway Compatible**: Works well with API gateways and load balancers

### Version Format

Versions follow semantic versioning principles:
- `v1` - Major version 1
- `v2` - Major version 2

Minor and patch versions are handled internally and do not require URL changes.

## Version Upgrade Policy

### When to Create a New Version

A new major version (`v2`, `v3`, etc.) should be created when:

1. **Breaking Changes to Request Format**
   - Removing required fields
   - Changing field types
   - Restructuring request payload

2. **Breaking Changes to Response Format**
   - Removing fields from response
   - Changing field types
   - Restructuring response payload

3. **Behavioral Changes**
   - Changing business logic that affects API consumers
   - Modifying authentication/authorization flows

### Non-Breaking Changes (No Version Bump)

The following changes do NOT require a new version:
- Adding new optional fields to requests
- Adding new fields to responses
- Adding new endpoints
- Adding new query parameters
- Bug fixes that don't change API contract
- Performance improvements

## Deprecation Policy

### Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| Announcement | T | Announce deprecation in API docs and changelog |
| Warning Period | T + 3 months | Add `Deprecation` header to responses |
| Sunset Warning | T + 6 months | Add `Sunset` header with removal date |
| Removal | T + 12 months | Remove deprecated version |

### Deprecation Headers

When an API version is deprecated, responses will include:

```http
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: </v2/vocs>; rel="successor-version"
```

### Communication Channels

1. **API Documentation**: Update with deprecation notices
2. **Changelog**: Document deprecation in release notes
3. **Response Headers**: Include deprecation headers
4. **Email Notifications**: Notify registered API consumers (if applicable)

## Breaking Changes Handling

### Migration Guide

For each major version change, provide:

1. **Detailed Migration Guide**
   - List all breaking changes
   - Provide code examples for migration
   - Include before/after comparisons

2. **Compatibility Layer** (when possible)
   - Adapter endpoints for gradual migration
   - Translation middleware

### Example Migration: v1 to v2 (Future)

When v2 is introduced, the migration guide will include:

```markdown
## Breaking Changes in v2

### VOC Response Structure

**v1 Response:**
```json
{
  "id": 1,
  "ticketId": "VOC-001",
  "status": "NEW"
}
```

**v2 Response:**
```json
{
  "data": {
    "id": 1,
    "ticketId": "VOC-001",
    "status": {
      "code": "NEW",
      "label": "New"
    }
  },
  "meta": {
    "version": "v2"
  }
}
```
```

## Concurrent Version Support

### Support Policy

| Version | Status | Support Until |
|---------|--------|---------------|
| v1 | **Active** | Current |
| v2 | Planned | TBD |

### Routing Configuration

```yaml
# API Gateway routing example
routes:
  - path: /v1/**
    service: voc-service-v1
  - path: /v2/**
    service: voc-service-v2
```

## Best Practices for API Consumers

### Recommendations

1. **Always use versioned endpoints**
   ```
   # Good
   GET /v1/vocs
   
   # Bad
   GET /vocs
   ```

2. **Monitor deprecation headers**
   ```java
   if (response.getHeader("Deprecation") != null) {
       log.warn("API version is deprecated");
   }
   ```

3. **Plan for version upgrades**
   - Subscribe to API changelog
   - Test against new versions in staging
   - Plan migration timeline

4. **Handle version-specific logic**
   ```java
   public interface VocClient {
       @GetMapping("/v1/vocs")
       List<VocResponse> getVocsV1();
       
       @GetMapping("/v2/vocs")
       VocPageResponse getVocsV2();
   }
   ```

## Implementation Details

### Controller Configuration

```java
@RestController
@RequestMapping("/v1/vocs")
public class VocController {
    // v1 endpoints
}

// Future v2 controller
@RestController
@RequestMapping("/v2/vocs")
public class VocControllerV2 {
    // v2 endpoints with new response structure
}
```

### Response Versioning

All responses include API version information:

```java
@Data
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String version = "v1";
    private LocalDateTime timestamp;
}
```

## Contact

For questions about API versioning:
- **Technical Issues**: Create an issue in the repository
- **Migration Support**: Contact the development team

---

*Last Updated: 2025-01-01*
*Document Version: 1.0*
