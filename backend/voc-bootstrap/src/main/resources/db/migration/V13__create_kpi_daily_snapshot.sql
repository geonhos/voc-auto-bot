-- KPI 일일 스냅샷 테이블
CREATE TABLE kpi_daily_snapshot (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL UNIQUE,
    total_vocs BIGINT NOT NULL DEFAULT 0,
    today_vocs BIGINT NOT NULL DEFAULT 0,
    resolved_vocs BIGINT NOT NULL DEFAULT 0,
    avg_resolution_hours DOUBLE PRECISION,
    category_stats JSONB,
    priority_stats JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_snapshot_date ON kpi_daily_snapshot(snapshot_date DESC);
