import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.mcp.client import lookup_reference_range_via_mcp


class AnalyzeLabsEndpointTest(unittest.TestCase):
    def setUp(self):
        self.original_api_key = os.environ.pop("GEMINI_API_KEY", None)
        self.client = TestClient(app)

    def tearDown(self):
        if self.original_api_key is not None:
            os.environ["GEMINI_API_KEY"] = self.original_api_key

    def test_analyze_labs_routes_results_by_severity(self):
        response = self.client.post(
            "/analyze_labs",
            json={
                "labs": [
                    {"test_name": "Hemoglobin", "value": "12.9", "unit": "g/dL"},
                    {"test_name": "Ferritin", "value": "180", "unit": "ug/L"},
                    {"test_name": "Ferritin", "value": "500", "unit": "ug/L"},
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["critical"]), 1)
        self.assertEqual(len(data["warning"]), 1)
        self.assertEqual(len(data["normal"]), 1)
        self.assertEqual(data["critical"][0]["severity"], "Critical")
        self.assertEqual(data["warning"][0]["severity"], "Warning")
        self.assertEqual(data["normal"][0]["severity"], "Normal")

    def test_analyze_labs_handles_text_based_results(self):
        response = self.client.post(
            "/analyze_labs",
            json={
                "labs": [
                    {
                        "test_name": "Protein (Strip)",
                        "value": "Negatif",
                        "unit": "mg/dL",
                    },
                    {
                        "test_name": "Eritrosit (Strip)",
                        "value": "1+",
                        "unit": "-",
                    },
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["warning"]), 1)
        self.assertEqual(len(data["normal"]), 1)
        self.assertEqual(data["warning"][0]["test_name"], "Eritrosit (Strip)")

    def test_analyze_labs_rejects_unknown_lab_name(self):
        response = self.client.post(
            "/analyze_labs",
            json={
                "labs": [
                    {
                        "test_name": "Unknown Test",
                        "value": "10",
                        "unit": "mg/dL",
                    }
                ]
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Unknown lab test name", response.json()["detail"])

    def test_analyze_labs_rejects_missing_labs(self):
        response = self.client.post("/analyze_labs", json={"labs": []})

        self.assertEqual(response.status_code, 422)

    def test_stream_endpoint_returns_progress_events(self):
        response = self.client.post(
            "/analyze_labs/stream",
            json={
                "labs": [
                    {"test_name": "Ferritin", "value": "500", "unit": "ug/L"},
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.text

        self.assertIn('"event": "stage"', body)
        self.assertIn('"event": "result_start"', body)
        self.assertIn('"event": "explanation_delta"', body)
        self.assertIn('"event": "complete"', body)

    def test_mcp_client_can_lookup_reference_range(self):
        reference = lookup_reference_range_via_mcp("Hemoglobin")

        self.assertIsNotNone(reference)
        self.assertEqual(reference["test_name"], "Hemoglobin")
        self.assertEqual(reference["reference_range"], "12-15")

    @patch("app.services.llm_service.ChatGoogleGenerativeAI")
    def test_analyze_labs_returns_safe_fallback_when_llm_fails(self, mock_llm):
        os.environ["GEMINI_API_KEY"] = "fake-test-key"
        mock_llm.return_value.invoke.side_effect = RuntimeError("LLM unavailable")

        response = self.client.post(
            "/analyze_labs",
            json={
                "labs": [
                    {"test_name": "Ferritin", "value": "500", "unit": "ug/L"},
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        explanation = response.json()["critical"][0]["explanation"]
        self.assertIn("AI explanation is temporarily unavailable", explanation)
        self.assertIn("qualified healthcare professional", explanation)


if __name__ == "__main__":
    unittest.main()
