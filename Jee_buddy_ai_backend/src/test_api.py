import requests
import json

url = 'http://127.0.0.1:8000/api/solve-math/'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

data = {
    "question": "Solve this physics problem: A car travels 100 meters in 5 seconds. What is its average velocity?",
    "context": {
        "user_id": "test-user-123",
        "session_id": "test-session-456",
        "subject": "physics",
        "topic": "kinematics",
        "interaction_type": "solve",
        "pinnedText": "",
        "selectedText": "",
        "image": "null",
        "history_limit": 100,
        "chat_history": []
    }
}

try:
    response = requests.post(url, json=data, headers=headers)
    print("Request JSON:")
    print(json.dumps(data, indent=2))
    print("\nStatus Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print(f"Error: {str(e)}") 