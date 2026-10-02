import os
import io
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import init_db

@pytest.fixture(autouse=True, scope="session")
def setup_database():
    asyncio.run(init_db())

client = TestClient(app)


def test_health_and_ready():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_ready = client.get("/api/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] in ["ready", "degraded"]

def test_auth_flow():
    # 1. Register User 1
    email1 = f"ramesh_{os.urandom(4).hex()}@bharat.in"
    res1 = client.post("/api/auth/register", json={
        "name": "Ramesh Kumar",
        "email": email1,
        "password": "Password123!",
        "preferred_language": "hi"
    })
    assert res1.status_code == 201
    data1 = res1.json()
    assert "access_token" in data1
    token1 = data1["access_token"]
    assert data1["preferred_language"] == "hi"

    # 2. Get Current User /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email1

    # 3. Login User 1
    login_res = client.post("/api/auth/login", json={
        "email": email1,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": email1,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_document_and_chat_rag_flow():
    import fitz  # PyMuPDF
    # Create a small valid PDF in memory
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text(
        (50, 72),
        "GOVERNMENT SCHOLARSHIP 2026 NOTIFICATION\n"
        "Eligibility: Students with annual family income below Rs 2,50,000.\n"
        "Must have scored at least 60 percent marks in class 12.\n"
        "Required Documents: Aadhaar Card, Income Certificate, 12th Marksheet.\n"
        "Deadline for application submission: 31st October 2026.\n"
        "Application portal: https://scholarships.gov.in"
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    # Register user
    email = f"priya_{os.urandom(4).hex()}@bharat.in"
    reg = client.post("/api/auth/register", json={
        "name": "Priya Sharma",
        "email": email,
        "password": "SecurePassword123!",
        "preferred_language": "ta"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload PDF
    files = {"file": ("scholarship_notification.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    upload_res = client.post("/api/documents/upload", files=files, headers=headers)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["status"] == "READY"
    assert doc_data["page_count"] == 1
    doc_id = doc_data["id"]

    # List documents
    list_res = client.get("/api/documents", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Ask grounded question
    chat_res = client.post("/api/chat", json={
        "document_id": doc_id,
        "question": "What is the deadline and required documents for this scholarship?",
        "language": "en"
    }, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["role"] == "assistant"
    assert len(chat_data["citations"]) >= 1
    assert chat_data["citations"][0]["page_number"] == 1

    # Verify action plan & deadline parsed
    assert chat_data["action_plan"] is not None
    assert len(chat_data["action_plan"]["steps"]) >= 1

    # Verify conversations endpoint
    conv_list = client.get("/api/chat/conversations", headers=headers)
    assert conv_list.status_code == 200
    assert len(conv_list.json()) >= 1

def test_multi_tenancy_isolation():
    # User A
    user_a = client.post("/api/auth/register", json={
        "name": "User A",
        "email": f"usera_{os.urandom(4).hex()}@bharat.in",
        "password": "Password123!"
    }).json()
    token_a = user_a["access_token"]

    # User B
    user_b = client.post("/api/auth/register", json={
        "name": "User B",
        "email": f"userb_{os.urandom(4).hex()}@bharat.in",
        "password": "Password123!"
    }).json()
    token_b = user_b["access_token"]

    # User A uploads a doc
    import fitz
    doc = fitz.open()
    p = doc.new_page()
    p.insert_text((50, 72), "Private confidential file for User A only.")
    pdf_bytes = doc.tobytes()
    doc.close()

    res = client.post(
        "/api/documents/upload",
        files={"file": ("private_a.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    doc_id_a = res.json()["id"]

    # User B tries to access User A's doc -> 404
    forbidden_res = client.get(
        f"/api/documents/{doc_id_a}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert forbidden_res.status_code == 404
