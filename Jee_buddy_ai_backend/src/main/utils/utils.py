import jwt
from django.conf import settings

def extract_user_id_from_jwt(token: str) -> str:
    try:

        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])


        # Extract user_id from the decoded token
        uuid = decoded_token.get('sub') or decoded_token.get('session_id')

        if not uuid:
            raise ValueError("Invalid token: No user_id found")
        
        return uuid
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
    except Exception as e:
        raise ValueError(f"An error occurred while processing the token: {str(e)}")
