"""Sentiment analysis service using Ollama LLM."""

import json
import logging
import re

from langchain_community.llms import Ollama

logger = logging.getLogger(__name__)


class SentimentService:
    """VOC 텍스트 감성 분석 서비스 (Ollama LLM 기반)."""

    def __init__(
        self,
        model_name: str = "gpt-oss:20b",
        ollama_base_url: str = "http://localhost:11434",
    ):
        self.llm = Ollama(model=model_name, base_url=ollama_base_url, temperature=0.1)

    def analyze(self, text: str) -> dict:
        """Analyze sentiment of the given text.

        Args:
            text: VOC text to analyze.

        Returns:
            dict with sentiment, confidence, and emotions.
        """
        prompt = f"""You are a sentiment analysis expert. Analyze the following customer feedback text and classify its sentiment.

Text: {text}

Respond ONLY with a valid JSON object (no markdown code blocks):
{{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0 to 1.0,
  "emotions": {{
    "anger": 0.0 to 1.0,
    "frustration": 0.0 to 1.0,
    "satisfaction": 0.0 to 1.0,
    "urgency": 0.0 to 1.0
  }}
}}

Rules:
- "positive": customer expresses satisfaction, gratitude, or positive experience
- "negative": customer expresses complaint, frustration, anger, or dissatisfaction
- "neutral": factual inquiry, general question, or no clear emotion
- confidence should reflect how certain you are about the classification
- emotions should reflect the intensity of each emotion detected"""

        try:
            response = self.llm.invoke(prompt)
            return self._parse_response(response)
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "emotions": {
                    "anger": 0.0,
                    "frustration": 0.0,
                    "satisfaction": 0.0,
                    "urgency": 0.0,
                },
            }

    def _parse_response(self, response: str) -> dict:
        """Parse LLM response to extract sentiment data."""
        # Remove markdown code blocks if present
        response = re.sub(r"```json\s*", "", response)
        response = re.sub(r"```\s*$", "", response)
        response = response.strip()

        # Find JSON object
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if not json_match:
            logger.warning("No JSON found in sentiment response")
            return self._default_result()

        try:
            result = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in sentiment response: {e}")
            return self._default_result()

        # Validate and normalize
        sentiment = result.get("sentiment", "neutral")
        if sentiment not in ("positive", "negative", "neutral"):
            sentiment = "neutral"

        confidence = result.get("confidence", 0.5)
        if not isinstance(confidence, (int, float)):
            confidence = 0.5
        confidence = max(0.0, min(1.0, float(confidence)))

        emotions = result.get("emotions", {})
        if not isinstance(emotions, dict):
            emotions = {}

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "emotions": emotions,
        }

    def _default_result(self) -> dict:
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "emotions": {
                "anger": 0.0,
                "frustration": 0.0,
                "satisfaction": 0.0,
                "urgency": 0.0,
            },
        }
