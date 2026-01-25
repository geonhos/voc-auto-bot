package com.geonho.vocautobot.application.common;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.annotation.*;

/**
 * UseCase 계층의 서비스를 나타내는 어노테이션.
 * 트랜잭션 처리와 컴포넌트 스캔을 위한 메타 어노테이션.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Service
@Transactional
public @interface UseCase {
}
