"""Service for recording and querying AI model performance metrics."""

import logging
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)


class MetricsService:
    """Records analysis metrics and provides aggregated summaries."""

    def __init__(self, db_pool: ConnectionPool):
        self.db_pool = db_pool

    def record_metric(
        self,
        analysis_method: str,
        confidence_score: float,
        latency_ms: int,
        json_parse_success: bool,
        model_name: str,
        embedding_model: str,
    ) -> UUID:
        """Record a single analysis metric and return the request_id.

        Args:
            analysis_method: RAG, RULE_BASED, or DIRECT_LLM.
            confidence_score: Analysis confidence score (0.0 to 1.0).
            latency_ms: Analysis latency in milliseconds.
            json_parse_success: Whether the LLM JSON response was parsed successfully.
            model_name: LLM model name used.
            embedding_model: Embedding model name used.

        Returns:
            The generated request_id (UUID).
        """
        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO model_metrics
                        (analysis_method, confidence_score, latency_ms,
                         json_parse_success, model_name, embedding_model)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING request_id
                    """,
                    (
                        analysis_method,
                        confidence_score,
                        latency_ms,
                        json_parse_success,
                        model_name,
                        embedding_model,
                    ),
                )
                row = cur.fetchone()
                request_id = row[0]
            conn.commit()
        logger.info(
            "Recorded metric: method=%s confidence=%.2f latency=%dms request_id=%s",
            analysis_method,
            confidence_score,
            latency_ms,
            request_id,
        )
        return request_id

    def record_feedback(self, request_id: str, feedback: str) -> bool:
        """Record user feedback for a specific analysis request.

        Args:
            request_id: UUID of the analysis request.
            feedback: "GOOD" or "BAD".

        Returns:
            True if the feedback was recorded, False if request_id not found.
        """
        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE model_metrics
                    SET user_feedback = %s
                    WHERE request_id = %s
                    """,
                    (feedback, request_id),
                )
                updated = cur.rowcount
            conn.commit()
        if updated == 0:
            logger.warning("Feedback target not found: request_id=%s", request_id)
            return False
        logger.info("Recorded feedback: request_id=%s feedback=%s", request_id, feedback)
        return True

    def get_metrics_summary(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> dict:
        """Get aggregated metrics summary for a date range.

        Args:
            start_date: Start date (ISO format, defaults to 7 days ago).
            end_date: End date (ISO format, defaults to now).

        Returns:
            Summary dict with total_requests, avg_latency, avg_confidence,
            json_success_rate, method_distribution, feedback_stats.
        """
        now = datetime.utcnow()
        start = (
            datetime.fromisoformat(start_date)
            if start_date
            else now - timedelta(days=7)
        )
        end = datetime.fromisoformat(end_date) if end_date else now

        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                # Overall stats
                cur.execute(
                    """
                    SELECT
                        COUNT(*) AS total_requests,
                        COALESCE(AVG(latency_ms), 0) AS avg_latency,
                        COALESCE(AVG(confidence_score), 0) AS avg_confidence,
                        COALESCE(
                            AVG(CASE WHEN json_parse_success THEN 1.0 ELSE 0.0 END), 0
                        ) AS json_success_rate
                    FROM model_metrics
                    WHERE created_at BETWEEN %s AND %s
                    """,
                    (start, end),
                )
                row = cur.fetchone()
                total_requests = row[0]
                avg_latency = round(float(row[1]), 1)
                avg_confidence = round(float(row[2]), 3)
                json_success_rate = round(float(row[3]), 3)

                # Method distribution
                cur.execute(
                    """
                    SELECT analysis_method, COUNT(*) AS cnt
                    FROM model_metrics
                    WHERE created_at BETWEEN %s AND %s
                    GROUP BY analysis_method
                    ORDER BY cnt DESC
                    """,
                    (start, end),
                )
                method_distribution = {
                    r[0]: r[1] for r in cur.fetchall()
                }

                # Feedback stats
                cur.execute(
                    """
                    SELECT user_feedback, COUNT(*) AS cnt
                    FROM model_metrics
                    WHERE created_at BETWEEN %s AND %s
                      AND user_feedback IS NOT NULL
                    GROUP BY user_feedback
                    """,
                    (start, end),
                )
                feedback_stats = {r[0]: r[1] for r in cur.fetchall()}

        return {
            "total_requests": total_requests,
            "avg_latency_ms": avg_latency,
            "avg_confidence": avg_confidence,
            "json_success_rate": json_success_rate,
            "method_distribution": method_distribution,
            "feedback_stats": feedback_stats,
            "period": {
                "start": start.isoformat(),
                "end": end.isoformat(),
            },
        }

    def check_drift(
        self, current_week_start: Optional[str] = None, baseline_weeks: int = 4
    ) -> dict:
        """Check for confidence drift compared to baseline period.

        Compares the current week's avg_confidence against the average of
        the previous `baseline_weeks` weeks. Logs a warning if drift exceeds 10%.

        Args:
            current_week_start: Start of the current week (ISO format, defaults to
                the most recent Monday).
            baseline_weeks: Number of previous weeks to use as baseline.

        Returns:
            Dict with current_avg, baseline_avg, drift_pct, is_drifting.
        """
        now = datetime.utcnow()
        if current_week_start:
            week_start = datetime.fromisoformat(current_week_start)
        else:
            # Most recent Monday
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

        week_end = week_start + timedelta(days=7)
        baseline_start = week_start - timedelta(weeks=baseline_weeks)

        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                # Current week average confidence
                cur.execute(
                    """
                    SELECT COALESCE(AVG(confidence_score), 0), COUNT(*)
                    FROM model_metrics
                    WHERE created_at BETWEEN %s AND %s
                    """,
                    (week_start, week_end),
                )
                row = cur.fetchone()
                current_avg = float(row[0])
                current_count = row[1]

                # Baseline average confidence
                cur.execute(
                    """
                    SELECT COALESCE(AVG(confidence_score), 0), COUNT(*)
                    FROM model_metrics
                    WHERE created_at BETWEEN %s AND %s
                    """,
                    (baseline_start, week_start),
                )
                row = cur.fetchone()
                baseline_avg = float(row[0])
                baseline_count = row[1]

        # Calculate drift
        if baseline_avg > 0:
            drift_pct = round((baseline_avg - current_avg) / baseline_avg * 100, 1)
        else:
            drift_pct = 0.0

        is_drifting = drift_pct >= 10.0

        if is_drifting:
            logger.warning(
                "DRIFT DETECTED: confidence dropped %.1f%% "
                "(current=%.3f, baseline=%.3f, current_count=%d, baseline_count=%d)",
                drift_pct,
                current_avg,
                baseline_avg,
                current_count,
                baseline_count,
            )

        return {
            "current_avg_confidence": round(current_avg, 3),
            "baseline_avg_confidence": round(baseline_avg, 3),
            "drift_pct": drift_pct,
            "is_drifting": is_drifting,
            "current_week_count": current_count,
            "baseline_count": baseline_count,
            "period": {
                "current_week_start": week_start.isoformat(),
                "baseline_start": baseline_start.isoformat(),
                "baseline_weeks": baseline_weeks,
            },
        }
