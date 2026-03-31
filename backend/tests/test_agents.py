from fastapi.testclient import TestClient

import main


def test_list_agents():
    client = TestClient(main.app)
    response = client.get("/agents")

    assert response.status_code == 200
    data = response.json()
    agent_ids = {agent["id"] for agent in data["agents"]}
    assert data["default_agent_id"] in agent_ids


def test_demo_chat_stream():
    client = TestClient(main.app)
    previous_mode = main.DEMO_MODE
    main.DEMO_MODE = True

    try:
        response = client.post("/chat", json={"message": "Hola"})
    finally:
        main.DEMO_MODE = previous_mode

    assert response.status_code == 200
    assert "data:" in response.text
    assert '"type": "done"' in response.text
