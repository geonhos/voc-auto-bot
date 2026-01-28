-- VOC Auto Bot - Initial Schema
-- Version: 1.0
-- Date: 2026-01-25

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'OPERATOR')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_user_username UNIQUE (username),
    CONSTRAINT idx_user_email UNIQUE (email)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- ===========================================
-- CATEGORY TABLE (Self-referencing hierarchy)
-- ===========================================
CREATE TABLE category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('MAIN', 'SUB')),
    parent_id BIGINT REFERENCES category(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_parent ON category(parent_id);
CREATE INDEX idx_category_active ON category(is_active);
CREATE INDEX idx_category_code ON category(code);

-- ===========================================
-- VOC TABLE
-- ===========================================
CREATE TABLE vocs (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    category_id BIGINT NOT NULL REFERENCES category(id),
    customer_email VARCHAR(100) NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    assignee_id BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_voc_ticket_id UNIQUE (ticket_id)
);

CREATE INDEX idx_voc_status ON vocs(status);
CREATE INDEX idx_voc_category ON vocs(category_id);
CREATE INDEX idx_voc_assignee ON vocs(assignee_id);
CREATE INDEX idx_voc_created_at ON vocs(created_at);

-- ===========================================
-- VOC ATTACHMENT TABLE
-- ===========================================
CREATE TABLE voc_attachments (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachment_voc ON voc_attachments(voc_id);

-- ===========================================
-- VOC MEMO TABLE
-- ===========================================
CREATE TABLE voc_memos (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voc_memos_voc ON voc_memos(voc_id);
CREATE INDEX idx_voc_memos_author ON voc_memos(author_id);

-- ===========================================
-- EMAIL TEMPLATE TABLE
-- ===========================================
CREATE TABLE email_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email template variables (ElementCollection)
CREATE TABLE email_template_variables (
    template_id BIGINT NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    variable_name VARCHAR(50) NOT NULL
);

CREATE INDEX idx_email_template_variables_template ON email_template_variables(template_id);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- ===========================================
-- EMAIL LOG TABLE
-- ===========================================
CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(100),
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- ===========================================
-- VECTOR EMBEDDINGS TABLE
-- Note: pgvector extension must be enabled first (V2)
-- This table is created in V2 after pgvector is enabled
-- ===========================================

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

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocs_updated_at BEFORE UPDATE ON vocs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voc_attachments_updated_at BEFORE UPDATE ON voc_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voc_memos_updated_at BEFORE UPDATE ON voc_memos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
