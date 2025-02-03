import psycopg2
import uuid

class MathTokenLimitAgent:
    def __init__(self):
        # Database Configuration
        self.DB_CONFIG = {
            "dbname": "postgres",
            "user": "postgres",
            "password": "jeebuddy@2025",  # Keep safe in production
            "host": "db.kymdueuxnesfvjdrueww.supabase.co",
            "port": 5432,
        }

        # Free User Limits
        self.FREE_USER_MAX_QUERIES = 5
        self.FREE_USER_MAX_TOKENS = 1000
        self.TOKENS_PER_75_WORDS = 100  # Token ratio

    def connect_db(self):
        """Establish a connection to the database."""
        try:
            conn = psycopg2.connect(**self.DB_CONFIG)
            return conn
        except Exception as e:
            print(f"Database connection error: {e}")
            return None

    def get_user(self, user_id):
        """Retrieve user details from the database by user_id."""
        conn = self.connect_db()
        if not conn:
            return None

        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT id, name, COALESCE(payment_status, ''), COALESCE(total_tokens, 0) FROM profiles WHERE id = %s",
                (user_id,),
            )
            user = cursor.fetchone()
            if user:
                return {
                    "id": str(user[0]),  # Convert UUID to string
                    "name": user[1],
                    "payment_status": user[2].strip().lower(),  # Avoid NULL issues
                    "total_tokens": user[3],
                }
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def update_user_usage(self, user_id, new_total_tokens):
        """Update token count for the user."""
        conn = self.connect_db()
        if not conn:
            return False

        cursor = conn.cursor()
        try:
            user_uuid = uuid.UUID(user_id)  # Ensure it's a valid UUID
            cursor.execute(
                "UPDATE profiles SET total_tokens = %s WHERE id = %s",
                (new_total_tokens, str(user_uuid)),
            )
            conn.commit()
            return True
        except ValueError:
            print("Invalid UUID format:", user_id)
            return False
        except Exception as e:
            print(f"Error updating user usage: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def calculate_tokens(self, text):
        """Calculate token count based on words (100 tokens ≈ 75 words)."""
        word_count = len(text.split())
        tokens_used = (word_count * self.TOKENS_PER_75_WORDS) // 75  # Token calculation
        return max(tokens_used, 1)  # Ensure at least 1 token is counted

    def process_query(self, user_id, prompt):
        """Handle user queries and enforce limits."""
        if not user_id or not prompt:
            return {"error": "user_id and prompt are required"}, 400

        user = self.get_user(user_id)
        if not user:
            return {"error": "User not found"}, 404

        user_id, payment_status, total_tokens = (
            user["id"],
            user["payment_status"],
            user["total_tokens"],
        )

        # Print payment status for debugging
        print(f"Payment status for user {user_id}: {payment_status}")

        # ✅ 2. If payment_status is "completed" → Unlimited chat
        if payment_status == "completed":
            tokens_used = self.calculate_tokens(prompt)
            new_total_tokens = total_tokens + tokens_used
            self.update_user_usage(user_id, new_total_tokens)

            response = f"GPT Response to: {prompt}"
            return {
                "response": response,
                "total_tokens_used": "Unlimited",
                "new_total_tokens": new_total_tokens,
            }

        # ✅ 3. If free user exceeds 1000 tokens → Block further queries
        if total_tokens >= self.FREE_USER_MAX_TOKENS:
            return {
                "message": "Sorry, you have reached your free 1000 token limit. Please recharge your subscription plan to continue."
            }

        # ✅ 4. Calculate tokens based on words
        tokens_used = self.calculate_tokens(prompt)

        # ✅ 5. Check if user exceeds 1000 token limit after this query
        new_total_tokens = total_tokens + tokens_used
        if new_total_tokens > self.FREE_USER_MAX_TOKENS:
            return {
                "message": "Sorry, you have reached your free 1000 token limit. Please recharge your subscription plan to continue."
            }

        # ✅ 6. Update total tokens in the database
        self.update_user_usage(user_id, new_total_tokens)

        # Mocked GPT response (replace with actual GPT API call)
        response = f"GPT Response to: {prompt}"

        return {
            "response": response,
            "tokens_used": tokens_used,
            "new_total_tokens": new_total_tokens,
        }