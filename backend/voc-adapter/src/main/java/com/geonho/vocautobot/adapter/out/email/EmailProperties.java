package com.geonho.vocautobot.adapter.out.email;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "spring.mail")
@Getter
@Setter
public class EmailProperties {

    private String host;
    private int port;
    private String username;
    private String password;
    private Smtp smtp = new Smtp();
    private String from;
    private String fromName;

    @Getter
    @Setter
    public static class Smtp {
        private boolean auth;
        private boolean starttlsEnable;
        private boolean starttlsRequired;
    }
}
