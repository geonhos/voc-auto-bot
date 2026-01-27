package com.geonho.vocautobot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VocAutoBotApplication {

    public static void main(String[] args) {
        SpringApplication.run(VocAutoBotApplication.class, args);
    }
}
