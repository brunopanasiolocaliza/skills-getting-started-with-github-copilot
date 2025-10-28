import json
from fastapi.testclient import TestClient
import pytest

from src.app import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # Should be a dict with known activities
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_unregister_flow(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure the test email is not already present (if it is, remove it first)
    resp = client.get("/activities")
    assert resp.status_code == 200
    activities = resp.json()
    if email in activities[activity]["participants"]:
        client.delete(f"/activities/{activity}/signup", params={"email": email})

    # Sign up
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant is present
    resp = client.get("/activities")
    activities = resp.json()
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    res2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res2.status_code == 400
    assert res2.json().get("detail") == "Student is already signed up"

    # Unregister
    res3 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert res3.status_code == 200
    assert "Unregistered" in res3.json().get("message", "")

    # Verify removal
    resp = client.get("/activities")
    activities = resp.json()
    assert email not in activities[activity]["participants"]
