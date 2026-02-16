-- VOC 상태 변경 이력 테이블
CREATE TABLE voc_status_history (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by BIGINT REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vsh_voc_id ON voc_status_history(voc_id);
CREATE INDEX idx_vsh_created ON voc_status_history(created_at);
