import json
import requests

url = "http://localhost:8000/api/solve-math/"

# Create multipart form data
files = {
    'image': ('circuit.jpg', open('C:/Users/surya/Downloads/circuit.jpg', 'rb'), 'image/jpeg')
}

data = {
    'question': "In this circuit diagram, calculate the equivalent resistance",
    'context': json.dumps({
        'session_id': "image_test_1",
        'interaction_type': "solve",
        'subject': "Physics",
        'topic': "Electric Circuits",
        'pinnedText': "Given: R1 = 2Ω, R2 = 4Ω in parallel"
    })
}

response = requests.post(url, data=data, files=files)
print(response.json())