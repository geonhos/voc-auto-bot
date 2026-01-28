-- VOC Auto Bot - Seed Data
-- Version: 3.0
-- Date: 2026-01-25

-- ===========================================
-- DEFAULT ADMIN USER
-- Password: Admin123! (BCrypt encoded)
-- ===========================================
INSERT INTO users (username, password, email, name, role, is_active, is_locked, failed_login_attempts, created_at, updated_at)
VALUES (
    'admin',
    '$2b$10$dPjPjPUvoOZ09yOIp.l5VeTfyiJjuWiPS.TJnRzmQEakdVXhfWUQG',
    'admin@voc-auto-bot.com',
    '시스템 관리자',
    'ADMIN',
    true,
    false,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ===========================================
-- DEFAULT CATEGORIES
-- ===========================================
-- Main Categories (type: MAIN, level: 1)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('오류/버그', 'ERROR', 'MAIN', NULL, '시스템 오류 및 버그 관련 VOC', true, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('기능 요청', 'FEATURE', 'MAIN', NULL, '신규 기능 및 개선 요청', true, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('문의', 'INQUIRY', 'MAIN', NULL, '일반 문의 사항', true, 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('불만/개선', 'COMPLAINT', 'MAIN', NULL, '서비스 불만 및 개선 요청', true, 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('칭찬', 'PRAISE', 'MAIN', NULL, '서비스 및 직원 칭찬', true, 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub Categories for 오류/버그 (id: 1)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('시스템 오류', 'ERROR_SYSTEM', 'SUB', 1, '시스템 장애 및 오류', true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('UI/UX 오류', 'ERROR_UI', 'SUB', 1, '화면 및 사용성 오류', true, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('데이터 오류', 'ERROR_DATA', 'SUB', 1, '데이터 정합성 오류', true, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('결제 오류', 'ERROR_PAYMENT', 'SUB', 1, '결제 관련 오류', true, 4, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub Categories for 기능 요청 (id: 2)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('신규 기능', 'FEATURE_NEW', 'SUB', 2, '새로운 기능 요청', true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('기능 개선', 'FEATURE_IMPROVE', 'SUB', 2, '기존 기능 개선 요청', true, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('통합 요청', 'FEATURE_INTEGRATION', 'SUB', 2, '외부 시스템 연동 요청', true, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub Categories for 문의 (id: 3)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('사용 방법', 'INQUIRY_USAGE', 'SUB', 3, '서비스 사용 방법 문의', true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('계정 관련', 'INQUIRY_ACCOUNT', 'SUB', 3, '계정 및 인증 관련 문의', true, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('결제/환불', 'INQUIRY_PAYMENT', 'SUB', 3, '결제 및 환불 관련 문의', true, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('기타 문의', 'INQUIRY_ETC', 'SUB', 3, '기타 일반 문의', true, 4, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub Categories for 불만/개선 (id: 4)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('서비스 불만', 'COMPLAINT_SERVICE', 'SUB', 4, '서비스 품질 불만', true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('응대 불만', 'COMPLAINT_SUPPORT', 'SUB', 4, '고객 응대 불만', true, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('속도/성능', 'COMPLAINT_PERFORMANCE', 'SUB', 4, '시스템 속도 및 성능 불만', true, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub Categories for 칭찬 (id: 5)
INSERT INTO category (name, code, type, parent_id, description, is_active, sort_order, level, created_at, updated_at) VALUES
('서비스 칭찬', 'PRAISE_SERVICE', 'SUB', 5, '서비스 품질 칭찬', true, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('직원 칭찬', 'PRAISE_STAFF', 'SUB', 5, '직원 응대 칭찬', true, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===========================================
-- DEFAULT EMAIL TEMPLATES
-- ===========================================
INSERT INTO email_templates (name, subject, body, is_active, created_at, updated_at) VALUES
(
    'VOC 접수 완료 안내',
    '[{{ticketId}}] VOC가 접수되었습니다',
    '<p>안녕하세요.</p><p>고객님께서 접수하신 VOC가 정상적으로 등록되었습니다.</p><ul><li>접수 번호: {{ticketId}}</li><li>제목: {{title}}</li><li>접수 일시: {{createdAt}}</li></ul><p>담당자 배정 후 순차적으로 처리될 예정입니다.</p>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'VOC 처리 완료 안내',
    '[{{ticketId}}] VOC 처리가 완료되었습니다',
    '<p>안녕하세요.</p><p>고객님께서 접수하신 VOC가 처리 완료되었습니다.</p><ul><li>접수 번호: {{ticketId}}</li><li>제목: {{title}}</li><li>처리 상태: 완료</li></ul><p>[처리 내용]</p><p>{{processingNote}}</p>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'VOC 반려 안내',
    '[{{ticketId}}] VOC 처리 결과 안내',
    '<p>안녕하세요.</p><p>고객님께서 접수하신 VOC가 아래 사유로 반려 처리되었습니다.</p><ul><li>접수 번호: {{ticketId}}</li><li>제목: {{title}}</li><li>처리 상태: 반려</li></ul><p>[반려 사유]</p><p>{{rejectReason}}</p>',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Email template variables
INSERT INTO email_template_variables (template_id, variable_name) VALUES
(1, 'ticketId'), (1, 'title'), (1, 'createdAt'),
(2, 'ticketId'), (2, 'title'), (2, 'processingNote'),
(3, 'ticketId'), (3, 'title'), (3, 'rejectReason');

-- ===========================================
-- SAMPLE VOC DATA
-- ===========================================
INSERT INTO vocs (ticket_id, title, content, status, priority, category_id, customer_email, customer_name, created_at, updated_at) VALUES
(
    'VOC-20260127-0001',
    '결제 오류 발생',
    '결제 진행 중 오류가 발생했습니다. 결제 버튼 클릭 후 약 30초간 대기 후 타임아웃 에러 메시지가 표시되었습니다.',
    'NEW',
    'HIGH',
    9,
    'hong@example.com',
    '홍길동',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'VOC-20260127-0002',
    '앱 사용 방법 문의',
    '앱에서 주문 내역 확인하는 방법을 알고 싶습니다.',
    'IN_PROGRESS',
    'NORMAL',
    13,
    'kim@example.com',
    '김철수',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
