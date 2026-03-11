"""
Tests for enrich_tickets_with_ai using mock ticket data.
Requires backend deps (e.g. activate venv with pandas, pydantic, etc.).
Live API test requires GENAI_API_KEY in backend/.env or environment.

Run from project root:
  python -m pytest backend/tests/test_enrich_tickets.py -v -s
  python backend/tests/test_enrich_tickets.py
"""
import json
import os
import sys
from unittest.mock import MagicMock, patch

# Project root so "backend" is importable when run as script (e.g. python backend/tests/test_enrich_tickets.py)
_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(os.path.dirname(_here))
if _root not in sys.path:
    sys.path.insert(0, _root)

# Load backend/.env so GENAI_API_KEY is available when running from project root
try:
    from dotenv import load_dotenv
    _backend_env = os.path.join(_root, "backend", ".env")
    if os.path.exists(_backend_env):
        load_dotenv(_backend_env)
except ImportError:
    pass

from backend.ai_suggestions import JsonTicket, TicketList, enrich_tickets_with_ai


# Mock raw tickets as returned by database.get_tickets()
MOCK_RAW_TICKETS = [
    {
        "id": 1,
        "receiver": "cloud-finops@company.com",
        "description": "Weekly spend exceeded $5000 for provider AWS",
        "raised_at": "2025-03-10 14:30:00",
    },
    {
        "id": 2,
        "receiver": "platform-team",
        "description": "Usage dropped below 10% threshold for reserved instances",
        "raised_at": "2025-03-10 12:00:00",
    },
    {
        "id": 3,
        "receiver": "billing-alerts",
        "description": "Daily net_cost > $200 for service_name EC2 in us-east-1",
        "raised_at": "2025-03-09 23:45:00",
    },
]


def _trunc(s, max_len=80):
    s = s or ""
    return (s[:max_len] + "...") if len(s) > max_len else s


def _print_enriched(tickets, label):
    print(f"\n{'='*60}\n{label}\n{'='*60}")
    for i, t in enumerate(tickets):
        if isinstance(t, JsonTicket):
            d = t.model_dump()
        else:
            d = t
        print(f"\n--- Ticket {i + 1} ---")
        print(f"  title:       {d.get('title', '')}")
        print(f"  description: {_trunc(d.get('description', ''))}")
        print(f"  action:      {_trunc(d.get('action', ''))}")
        print(f"  reasoning:   {_trunc(d.get('reasoning', ''))}")
        print(f"  priority:    {d.get('priority', '')}")
    print()


def test_enrich_fallback_no_client():
    """When no API client (no key), enrich_tickets_with_ai uses fallback and does not call Gemini."""
    with patch("backend.ai_suggestions._get_genai_client", return_value=None):
        result = enrich_tickets_with_ai(MOCK_RAW_TICKETS)

    assert len(result) == len(MOCK_RAW_TICKETS)
    for raw, enriched in zip(MOCK_RAW_TICKETS, result):
        assert isinstance(enriched, JsonTicket)
        assert enriched.title == raw["description"][:60]
        assert enriched.description == raw["description"]
        assert enriched.action == "Review this ticket and take appropriate action."
        assert raw["receiver"] in enriched.reasoning
        assert enriched.priority == "Medium"

    _print_enriched(result, "Fallback (no API client) – mock ticket data enriched")


def test_enrich_with_mocked_ai_response():
    """When client is mocked to return valid JSON, enrich_tickets_with_ai returns AI-shaped tickets."""
    fake_ticket_list = {
        "suggested_tickets": [
            {
                "title": "AWS spend over budget",
                "description": "Weekly spend exceeded $5000 for AWS. Review usage and set budgets.",
                "action": "Review top cost services and consider reservations or rightsizing.",
                "reasoning": "Threshold breach indicates growth or unoptimized resources.",
                "priority": "High",
            },
            {
                "title": "Low utilisation on reserved instances",
                "description": "Usage dropped below 10% for reserved instances.",
                "action": "Consider converting to on-demand or downsizing reservations.",
                "reasoning": "Underuse suggests over-provisioning or changed workload.",
                "priority": "Medium",
            },
            {
                "title": "EC2 daily cost spike in us-east-1",
                "description": "Daily net cost exceeded $200 for EC2 in us-east-1.",
                "action": "Inspect instance types and running hours; check for leaks.",
                "reasoning": "Regional spike may indicate new workloads or misconfiguration.",
                "priority": "High",
            },
        ]
    }
    fake_response = MagicMock()
    fake_response.text = json.dumps(fake_ticket_list)

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = fake_response

    with patch("backend.ai_suggestions._get_genai_client", return_value=mock_client):
        result = enrich_tickets_with_ai(MOCK_RAW_TICKETS)

    assert len(result) == len(MOCK_RAW_TICKETS)
    assert result[0].title == "AWS spend over budget"
    assert result[0].priority == "High"
    assert result[1].title == "Low utilisation on reserved instances"

    _print_enriched(result, "Mocked AI response – structured output")


def test_enrich_live_api():
    """Call enrich_tickets_with_ai with real Gemini API (no mocks). Requires GENAI_API_KEY."""
    result = enrich_tickets_with_ai(MOCK_RAW_TICKETS)

    assert len(result) == len(MOCK_RAW_TICKETS)
    for i, enriched in enumerate(result):
        assert isinstance(enriched, JsonTicket)
        assert enriched.title
        assert enriched.description
        assert enriched.action
        assert enriched.reasoning
        assert enriched.priority in ("High", "Medium", "Low")

    _print_enriched(result, "Live Gemini API – enriched tickets")


def run_and_print():
    """Run all tests including live API call; print results to console."""
    # print("\nRunning tests for enrich_tickets_with_ai (mock ticket data, print to console)\n")
    # test_enrich_fallback_no_client()
    # test_enrich_with_mocked_ai_response()
    print("\n--- Live API test (real Gemini call) ---\n")
    test_enrich_live_api()
    print("\nDone.\n")


if __name__ == "__main__":
    run_and_print()
