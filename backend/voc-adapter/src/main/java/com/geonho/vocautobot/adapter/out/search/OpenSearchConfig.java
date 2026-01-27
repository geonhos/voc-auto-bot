package com.geonho.vocautobot.adapter.out.search;

import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManager;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.ClientTlsStrategyBuilder;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.nio.ssl.TlsStrategy;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.net.ssl.SSLContext;

/**
 * OpenSearch Configuration
 * OpenSearchClient 빈을 생성하고 설정
 */
@Configuration
@ConditionalOnProperty(prefix = "opensearch", name = "enabled", havingValue = "true", matchIfMissing = false)
public class OpenSearchConfig {

    private static final Logger log = LoggerFactory.getLogger(OpenSearchConfig.class);

    /**
     * OpenSearch Transport 빈 생성
     */
    @Bean
    public OpenSearchTransport openSearchTransport(OpenSearchProperties properties) {
        try {
            log.info("Creating OpenSearch transport - Host: {}:{}", properties.getHost(), properties.getPort());

            HttpHost host = new HttpHost(
                properties.getScheme(),
                properties.getHost(),
                properties.getPort()
            );

            ApacheHttpClient5TransportBuilder builder = ApacheHttpClient5TransportBuilder
                .builder(host)
                .setMapper(new JacksonJsonpMapper());

            // 인증 설정
            if (properties.requiresAuthentication()) {
                log.info("Configuring authentication for user: {}", properties.getUsername());
                BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
                credentialsProvider.setCredentials(
                    new AuthScope(host),
                    new UsernamePasswordCredentials(
                        properties.getUsername(),
                        properties.getPassword().toCharArray()
                    )
                );
                builder.setHttpClientConfigCallback(httpClientBuilder ->
                    httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider)
                );
            }

            // SSL 설정
            if (properties.isUseSsl()) {
                log.info("Configuring SSL for OpenSearch connection");
                configureSsl(builder, properties);
            }

            return builder.build();

        } catch (Exception e) {
            log.error("Failed to create OpenSearch transport", e);
            throw new IllegalStateException("OpenSearch Transport 생성 실패", e);
        }
    }

    /**
     * OpenSearchClient 빈 생성
     */
    @Bean
    public OpenSearchClient openSearchClient(OpenSearchTransport transport) {
        try {
            OpenSearchClient client = new OpenSearchClient(transport);

            // 연결 테스트
            boolean pingResult = client.ping().value();
            if (!pingResult) {
                throw new IllegalStateException("OpenSearch ping 실패");
            }

            log.info("OpenSearch client created and connection verified");
            return client;

        } catch (Exception e) {
            log.error("Failed to create OpenSearch client", e);
            throw new IllegalStateException("OpenSearchClient 생성 실패", e);
        }
    }

    /**
     * SSL 설정
     */
    private void configureSsl(ApacheHttpClient5TransportBuilder builder, OpenSearchProperties properties) {
        try {
            SSLContext sslContext = SSLContextBuilder.create()
                .loadTrustMaterial(null, (chains, authType) -> !properties.isVerifySslCertificate())
                .build();

            TlsStrategy tlsStrategy = ClientTlsStrategyBuilder.create()
                .setSslContext(sslContext)
                .build();

            PoolingAsyncClientConnectionManager connectionManager =
                PoolingAsyncClientConnectionManagerBuilder.create()
                    .setTlsStrategy(tlsStrategy)
                    .build();

            builder.setHttpClientConfigCallback(httpClientBuilder ->
                httpClientBuilder.setConnectionManager(connectionManager)
            );

        } catch (Exception e) {
            log.error("Failed to configure SSL", e);
            throw new IllegalStateException("SSL 설정 실패", e);
        }
    }
}
