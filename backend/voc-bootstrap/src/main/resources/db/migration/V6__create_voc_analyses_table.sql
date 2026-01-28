-- VOC 분석 결과 테이블
-- VOC 생성 후 비동기로 AI 분석을 수행하고 결과를 저장

CREATE TABLE IF NOT EXISTS voc_analyses (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    summary TEXT,
    confidence DOUBLE PRECISION,
    keywords TEXT,
    possible_causes TEXT,
    related_logs TEXT,
    recommendation TEXT,
    error_message TEXT,
    analyzed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_voc_analyses_voc FOREIGN KEY (voc_id) REFERENCES vocs(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_voc_analyses_voc_id ON voc_analyses(voc_id);
CREATE INDEX IF NOT EXISTS idx_voc_analyses_status ON voc_analyses(status);

COMMENT ON TABLE voc_analyses IS 'VOC AI 분석 결과 테이블';
COMMENT ON COLUMN voc_analyses.status IS 'PENDING, IN_PROGRESS, COMPLETED, FAILED';
COMMENT ON COLUMN voc_analyses.keywords IS 'JSON array of keywords';
COMMENT ON COLUMN voc_analyses.possible_causes IS 'JSON array of possible causes';
COMMENT ON COLUMN voc_analyses.related_logs IS 'JSON array of related log entries';
