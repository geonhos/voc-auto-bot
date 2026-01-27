# Build stage
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Copy gradle files first for caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY voc-domain/build.gradle ./voc-domain/
COPY voc-application/build.gradle ./voc-application/
COPY voc-adapter/build.gradle ./voc-adapter/
COPY voc-bootstrap/build.gradle ./voc-bootstrap/

# Download dependencies (cached if gradle files don't change)
RUN gradle dependencies --no-daemon || true

# Copy source code and resources
COPY voc-domain/src ./voc-domain/src
COPY voc-application/src ./voc-application/src
COPY voc-adapter/src ./voc-adapter/src
COPY voc-bootstrap/src ./voc-bootstrap/src

# Build the application
RUN gradle :voc-bootstrap:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Add non-root user for security
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh appuser

# Copy the built jar
COPY --from=builder /app/voc-bootstrap/build/libs/voc-auto-bot.jar app.jar

# Change ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
