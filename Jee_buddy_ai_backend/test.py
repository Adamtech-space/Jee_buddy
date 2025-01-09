# Using requests
import requests

url = 'http://localhost:8000/api/solve-math/'
files = {
    'image': open('C:/surya/Muscle Mind/JEE PROJECT/Jee buddy backend/maths.jpg', 'rb'),
    'question': 'Please solve this mathematical problem',
    'approach_type': 'step_by_step',
}

response = requests.post(url, files=files)
print(response.json())