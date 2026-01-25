-- VOC Auto Bot - Seed Data
-- Version: 3.0
-- Date: 2026-01-25

-- ===========================================
-- DEFAULT ADMIN USER
-- Password: Admin123! (BCrypt encoded)
-- ===========================================
INSERT INTO users (username, password, email, name, role, department, position, status)
VALUES (
    'admin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTtKVGAkN6',
    'admin@voc-auto-bot.com',
    '시스템 관리자',
    'ADMIN',
    'IT팀',
    '관리자',
    'ACTIVE'
);

-- ===========================================
-- DEFAULT CATEGORIES
-- ===========================================
-- Main Categories
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('오류/버그', 'MAIN', NULL, '시스템 오류 및 버그 관련 VOC', 1),
('기능 요청', 'MAIN', NULL, '신규 기능 요청 관련 VOC', 2),
('문의', 'MAIN', NULL, '일반 문의 관련 VOC', 3),
('불만/개선', 'MAIN', NULL, '불만 및 개선 요청 VOC', 4),
('칭찬', 'MAIN', NULL, '칭찬 및 감사 VOC', 5);

-- Sub Categories for 오류/버그 (id: 1)
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('시스템 오류', 'SUB', 1, '시스템 레벨 오류', 1),
('UI/UX 오류', 'SUB', 1, '사용자 인터페이스 오류', 2),
('데이터 오류', 'SUB', 1, '데이터 관련 오류', 3),
('결제 오류', 'SUB', 1, '결제 프로세스 오류', 4);

-- Sub Categories for 기능 요청 (id: 2)
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('신규 기능', 'SUB', 2, '새로운 기능 요청', 1),
('기능 개선', 'SUB', 2, '기존 기능 개선 요청', 2),
('통합 요청', 'SUB', 2, '외부 시스템 연동 요청', 3);

-- Sub Categories for 문의 (id: 3)
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('사용 방법', 'SUB', 3, '서비스 사용 방법 문의', 1),
('계정 관련', 'SUB', 3, '계정 및 인증 관련 문의', 2),
('결제/환불', 'SUB', 3, '결제 및 환불 관련 문의', 3),
('기타 문의', 'SUB', 3, '기타 일반 문의', 4);

-- Sub Categories for 불만/개선 (id: 4)
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('서비스 불만', 'SUB', 4, '서비스 관련 불만', 1),
('응대 불만', 'SUB', 4, '고객 응대 관련 불만', 2),
('속도/성능', 'SUB', 4, '속도 및 성능 관련 불만', 3);

-- Sub Categories for 칭찬 (id: 5)
INSERT INTO category (name, type, parent_id, description, sort_order) VALUES
('서비스 칭찬', 'SUB', 5, '서비스 관련 칭찬', 1),
('직원 칭찬', 'SUB', 5, '직원 응대 관련 칭찬', 2);

-- ===========================================
-- DEFAULT EMAIL TEMPLATES
-- ===========================================
INSERT INTO email_template (name, code, subject, body, is_active, is_system) VALUES
(
    'VOC 접수 완료 안내',
    'VOC_RECEIVED',
    '[{{ticketId}}] VOC가 접수되었습니다',
    '안녕하세요.

고객님께서 접수하신 VOC가 정상적으로 등록되었습니다.

■ 접수 번호: {{ticketId}}
■ 제목: {{title}}
■ 접수 일시: {{createdAt}}

담당자 배정 후 순차적으로 처리될 예정입니다.
진행 상황은 접수 번호와 이메일을 통해 조회하실 수 있습니다.

감사합니다.',
    TRUE,
    TRUE
),
(
    'VOC 처리 완료 안내',
    'VOC_COMPLETED',
    '[{{ticketId}}] VOC 처리가 완료되었습니다',
    '안녕하세요.

고객님께서 접수하신 VOC가 처리 완료되었습니다.

■ 접수 번호: {{ticketId}}
■ 제목: {{title}}
■ 처리 상태: 완료

[처리 내용]
{{processingNote}}

추가 문의사항이 있으시면 언제든지 연락해 주시기 바랍니다.

감사합니다.',
    TRUE,
    TRUE
),
(
    'VOC 반려 안내',
    'VOC_REJECTED',
    '[{{ticketId}}] VOC 처리 결과 안내',
    '안녕하세요.

고객님께서 접수하신 VOC가 아래 사유로 반려 처리되었습니다.

■ 접수 번호: {{ticketId}}
■ 제목: {{title}}
■ 처리 상태: 반려

[반려 사유]
{{rejectReason}}

추가 문의사항이 있으시면 언제든지 연락해 주시기 바랍니다.

감사합니다.',
    TRUE,
    TRUE
),
(
    '담당자 배정 안내 (내부용)',
    'ASSIGNEE_NOTIFICATION',
    '[내부] 새로운 VOC가 배정되었습니다 - {{ticketId}}',
    '새로운 VOC가 배정되었습니다.

■ 접수 번호: {{ticketId}}
■ 제목: {{title}}
■ 카테고리: {{category}}
■ 우선순위: {{priority}}
■ 접수 일시: {{createdAt}}

VOC 관리 시스템에서 상세 내용을 확인하시고 처리해 주시기 바랍니다.',
    TRUE,
    TRUE
);
