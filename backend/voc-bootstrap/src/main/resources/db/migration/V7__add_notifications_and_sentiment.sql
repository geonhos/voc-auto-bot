-- V7: Add notifications table and sentiment columns to vocs

-- 1. Notifications table for SSE real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    voc_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(user_id, is_read);

-- 2. Sentiment analysis columns on vocs table
ALTER TABLE vocs ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);
ALTER TABLE vocs ADD COLUMN IF NOT EXISTS sentiment_confidence DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_voc_sentiment ON vocs(sentiment);
