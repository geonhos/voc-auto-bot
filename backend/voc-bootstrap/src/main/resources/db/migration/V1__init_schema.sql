-- VOC Auto Bot - Initial Schema
-- Version: 1.0
-- Date: 2026-01-25

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('REPORTER', 'HANDLER', 'ADMIN')),
    department VARCHAR(100),
    position VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'TEMP_PASSWORD')),
    is_temporary_password BOOLEAN NOT NULL DEFAULT FALSE,
    login_fail_count INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ===========================================
-- CATEGORY TABLE (Self-referencing hierarchy)
-- ===========================================
CREATE TABLE category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('MAIN', 'SUB')),
    parent_id BIGINT REFERENCES category(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_type ON category(type);
CREATE INDEX idx_category_parent ON category(parent_id);
CREATE INDEX idx_category_active ON category(is_active);

-- ===========================================
-- VOC TABLE
-- ===========================================
CREATE TABLE voc (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(22) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    customer_name VARCHAR(50) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    main_category_id BIGINT NOT NULL REFERENCES category(id),
    sub_category_id BIGINT REFERENCES category(id),
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'ANALYZING', 'ANALYSIS_FAILED', 'PROCESSING', 'COMPLETED', 'REJECTED')),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    assignee_id BIGINT REFERENCES users(id),
    processing_note TEXT,
    reject_reason TEXT,
    analysis_completed_at TIMESTAMP,
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_ticket_id ON voc(ticket_id);
CREATE INDEX idx_voc_status ON voc(status);
CREATE INDEX idx_voc_priority ON voc(priority);
CREATE INDEX idx_voc_created_at ON voc(created_at);
CREATE INDEX idx_voc_assignee_status ON voc(assignee_id, status);
CREATE INDEX idx_voc_reporter ON voc(reporter_id);
CREATE INDEX idx_voc_main_category ON voc(main_category_id);

-- ===========================================
-- VOC ATTACHMENT TABLE
-- ===========================================
CREATE TABLE voc_attachment (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_attachment_voc ON voc_attachment(voc_id);

-- ===========================================
-- VOC ANALYSIS TABLE
-- ===========================================
CREATE TABLE voc_analysis (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL UNIQUE REFERENCES voc(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    suggested_category_id BIGINT REFERENCES category(id),
    suggested_priority VARCHAR(10) CHECK (suggested_priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    sentiment VARCHAR(10) CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
    keywords JSONB,
    confidence DECIMAL(3,2) NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_analysis_voc ON voc_analysis(voc_id);

-- ===========================================
-- LOG ANALYSIS RESULT TABLE
-- ===========================================
CREATE TABLE log_analysis_result (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    log_source VARCHAR(100) NOT NULL,
    log_period VARCHAR(50) NOT NULL,
    log_content TEXT NOT NULL,
    analysis TEXT NOT NULL,
    error_code VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_analysis_voc ON log_analysis_result(voc_id);

-- ===========================================
-- DB QUERY RESULT TABLE
-- ===========================================
CREATE TABLE db_query_result (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    query_name VARCHAR(100) NOT NULL,
    query_description VARCHAR(255) NOT NULL,
    result_data JSONB NOT NULL,
    record_count INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_db_query_result_voc ON db_query_result(voc_id);

-- ===========================================
-- SIMILAR VOC TABLE
-- ===========================================
CREATE TABLE similar_voc (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    similar_voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) NOT NULL,
    matched_keywords JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (voc_id, similar_voc_id),
    CHECK (voc_id != similar_voc_id)
);

CREATE INDEX idx_similar_voc_voc ON similar_voc(voc_id);
CREATE INDEX idx_similar_voc_similar ON similar_voc(similar_voc_id);

-- ===========================================
-- VOC MEMO TABLE
-- ===========================================
CREATE TABLE voc_memo (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_memo_voc ON voc_memo(voc_id);
CREATE INDEX idx_voc_memo_author ON voc_memo(author_id);

-- ===========================================
-- VOC STATUS HISTORY TABLE
-- ===========================================
CREATE TABLE voc_status_history (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by_id BIGINT NOT NULL REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_status_history_voc ON voc_status_history(voc_id);
CREATE INDEX idx_voc_status_history_created ON voc_status_history(created_at);

-- ===========================================
-- EMAIL TEMPLATE TABLE
-- ===========================================
CREATE TABLE email_template (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_template_code ON email_template(code);
CREATE INDEX idx_email_template_active ON email_template(is_active);

-- ===========================================
-- EMAIL LOG TABLE
-- ===========================================
CREATE TABLE email_log (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES voc(id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES email_template(id),
    recipient VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at TIMESTAMP,
    fail_reason TEXT,
    sent_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_log_voc ON email_log(voc_id);
CREATE INDEX idx_email_log_status ON email_log(status);

-- ===========================================
-- AUDIT LOG TABLE
-- ===========================================
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    actor_ip VARCHAR(45),
    before_data JSONB,
    after_data JSONB,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);

-- ===========================================
-- VOC DRAFT TABLE (for temporary saves)
-- ===========================================
CREATE TABLE voc_draft (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT,
    customer_name VARCHAR(50),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    main_category_id BIGINT REFERENCES category(id),
    sub_category_id BIGINT REFERENCES category(id),
    occurrence_time TIMESTAMP,
    draft_data JSONB,
    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_draft_user ON voc_draft(user_id);

-- ===========================================
-- REFRESH TOKEN TABLE
-- ===========================================
CREATE TABLE refresh_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_user ON refresh_token(user_id);
CREATE INDEX idx_refresh_token_token ON refresh_token(token);
CREATE INDEX idx_refresh_token_expires ON refresh_token(expires_at);

-- ===========================================
-- TRIGGER: Updated timestamp
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voc_updated_at BEFORE UPDATE ON voc FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voc_memo_updated_at BEFORE UPDATE ON voc_memo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_template_updated_at BEFORE UPDATE ON email_template FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
