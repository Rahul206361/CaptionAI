import os
import requests
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import sqlite3
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

def send_email(to_email, subject, text):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return False, "RESEND_API_KEY is missing"

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": "Bearer " + api_key,
                "Content-Type": "application/json"
            },
            json={
                "from": "onboarding@resend.dev",
                "to": [to_email],
                "subject": subject,
                "text": text
            },
            timeout=30
        )

        if response.status_code == 200:
            print("RESEND_STATUS:", response.status_code, flush=True)
            print("RESEND_RESPONSE:", response.text, flush=True)
            return True, response.json()

        return False, response.text

    except Exception as e:
        return False, str(e)


DB_PATH = os.path.join(os.path.dirname(__file__), "captionai.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, email_verified INTEGER DEFAULT 0, verification_token TEXT)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))""")
    conn.execute("""CREATE TABLE IF NOT EXISTS password_reset_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))""")
    conn.commit()
    conn.close()


def get_current_user():
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        return None
    conn = get_db()
    row = conn.execute(
        "SELECT users.* FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.token = ?",
        (token,)
    ).fetchone()
    conn.close()
    return row

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()
    name = str(data.get("name", "")).strip()

    if not email or "@" not in email:
        return jsonify({"success": False, "message": "Please enter a valid email."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters."}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()

    if existing:
        conn.close()
        return jsonify({"success": False, "message": "Email already registered."}), 409

    password_hash = generate_password_hash(password)
    verification_token = secrets.token_urlsafe(32)

    cur = conn.execute(
        "INSERT INTO users (email, name, password_hash, email_verified, verification_token) VALUES (?, ?, ?, ?, ?)",
        (email, name, password_hash, 0, verification_token)
    )
    user_id = cur.lastrowid

    conn.commit()
    conn.close()

    verification_link = "https://captionai-zgod.onrender.com/api/verify-email/" + verification_token
    send_email(
        email,
        "Verify your CaptionAI email",
        "Welcome to CaptionAI!\n\nPlease verify your email by opening this link:\n\n" + verification_link + "\n\nThis link is for email verification."
    )

    return jsonify({
        "success": True,
        "message": "Account created successfully. Please verify your email.",
        "user": {
            "id": user_id,
            "email": email,
            "name": name
        }
    })


@app.route("/api/verify-email/<token>", methods=["GET"])
def verify_email(token):
    conn = get_db()

    user = conn.execute(
        "SELECT id, email FROM users WHERE verification_token = ?",
        (token,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Invalid or expired verification link."
        }), 400

    conn.execute(
        "UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?",
        (user["id"],)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Email verified successfully."
    })


@app.route("/api/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not email or "@" not in email:
        return jsonify({
            "success": False,
            "message": "Please enter a valid email."
        }), 400

    conn = get_db()

    user = conn.execute(
        "SELECT id, email, email_verified FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({
            "success": True,
            "message": "If the email is registered, a verification email will be sent."
        })

    if user["email_verified"]:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Email is already verified."
        }), 400

    verification_token = secrets.token_urlsafe(32)

    conn.execute(
        "UPDATE users SET verification_token = ? WHERE id = ?",
        (verification_token, user["id"])
    )

    conn.commit()
    conn.close()

    verification_link = "https://captionai-zgod.onrender.com/api/verify-email/" + verification_token

    sent, result = send_email(
        email,
        "Verify your CaptionAI email",
        "Please verify your CaptionAI email by opening this link:\n\n"
        + verification_link
        + "\n\nThis verification link was requested again."
    )

    if not sent:
        return jsonify({
            "success": False,
            "message": "Unable to send verification email.", "error": result
        }), 500

    return jsonify({
        "success": True,
        "message": "Verification email sent successfully."
    })


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()

    if not email or "@" not in email:
        return jsonify({"success": False, "message": "Please enter a valid email."}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    # Do not reveal whether an email exists.
    if not user:
        conn.close()
        return jsonify({
            "success": True,
            "message": "If the email is registered, a reset link will be sent."
        })

    token = secrets.token_urlsafe(32)

    conn.execute(
        "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
        (user["id"],)
    )

    conn.execute(
        """
        INSERT INTO password_reset_tokens
        (user_id, token, expires_at)
        VALUES (?, ?, datetime('now', '+15 minutes'))
        """,
        (user["id"], token)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Password reset token created.",
        "reset_token": token
    })


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = str(data.get("token", "")).strip()
    password = str(data.get("password", ""))

    if not token:
        return jsonify({"success": False, "message": "Reset token is required."}), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters."
        }), 400

    conn = get_db()

    row = conn.execute(
        """
        SELECT user_id
        FROM password_reset_tokens
        WHERE token = ?
          AND used = 0
          AND expires_at > datetime('now')
        """,
        (token,)
    ).fetchone()

    if not row:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Invalid or expired reset token."
        }), 400

    password_hash = generate_password_hash(password)

    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (password_hash, row["user_id"])
    )

    conn.execute(
        "UPDATE password_reset_tokens SET used = 1 WHERE token = ?",
        (token,)
    )

    conn.execute(
        "DELETE FROM sessions WHERE user_id = ?",
        (row["user_id"],)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Password reset successfully."
    })

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user or not user["password_hash"] or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if not user["email_verified"]:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Please verify your email before logging in."
        }), 403

    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (user_id, token) VALUES (?, ?)",
        (user["id"], token)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    })

@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()

    if token:
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()

    return jsonify({"success": True, "message": "Logged out successfully."})

@app.route("/api/me")
def me():
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "message": "Not logged in."}), 401

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    })

@app.route("/api/profile", methods=["PUT"])
def update_profile():
    user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "Not logged in."
        }), 401

    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Name is required."
        }), 400

    if len(name) > 100:
        return jsonify({
            "success": False,
            "message": "Name is too long."
        }), 400

    conn = get_db()

    conn.execute(
        "UPDATE users SET name = ? WHERE id = ?",
        (name, user["id"])
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": name
        }
    })


@app.route("/api/health")
def health():
    return jsonify({
        "success": True,
        "status": "online",
        "app": "CaptionAI"
    })

@app.route("/")
def home():
    return jsonify({
        "success": True,
        "app": "CaptionAI",
        "message": "CaptionAI backend is running"
    })


@app.route("/api/status")
def status():
    return jsonify({
        "success": True,
        "status": "online"
    })















@app.route("/api/generate-caption", methods=["POST"])
def generate_caption():
    data = request.get_json(silent=True) or {}

    idea = str(data.get("idea", "")).strip()
    mood = str(data.get("mood", "Love")).strip()
    content_type = str(data.get("type", "Caption")).strip()
    language = str(data.get("language", "English")).strip()

    if not idea:
        return jsonify({
            "success": False,
            "message": "Please describe your photo, video or idea."
        }), 400

    type_instructions = {
        "Photo": """
Create one beautiful social media photo caption.
Keep it natural, attractive and concise.
Add suitable emojis and exactly 5 relevant hashtags.
""",

        "Video": """
Create one catchy Reels/video caption.
Make it engaging and suitable for Instagram Reels, Facebook and WhatsApp.
Add suitable emojis and exactly 5 relevant hashtags.
""",

        "WhatsApp Status": """
Create one short and powerful WhatsApp Status.
Keep it emotional, catchy and easy to read.
Add suitable emojis and exactly 5 relevant hashtags.
""",

        "Shayari": """
Create one original Hindi/Hinglish shayari.
Make it emotional, poetic and suitable for social media.
Use 2 to 6 lines.
Add suitable emojis and exactly 5 relevant hashtags.
""",

        "Instagram Bio": """
Create one stylish Instagram bio.
Keep it short, modern and attractive.
Use line breaks and suitable emojis.
Do not write a normal caption.
Add exactly 5 relevant hashtags.
""",

        "Hashtags": """
Generate exactly 15 relevant social media hashtags based on the idea and mood.
Do not write a caption.
Put each hashtag separated by a space.
"""
    }

    instructions = type_instructions.get(
        content_type,
        """
Create one attractive social media caption.
Add suitable emojis and exactly 5 relevant hashtags.
"""
    )

    prompt = f"""
You are a professional social media content creator.

Content type:
{content_type}

Idea:
{idea}

Mood:
{mood}

Language:
{language}

Language instructions:
- English: Write the content naturally in English.
- Hindi: Write the content in natural Hindi using Devanagari script.
- Hinglish: Write the content in natural Hindi-English mixed Roman script.
- Bengali: Write the content naturally in Bengali script.

{instructions}

Important:
- Return only the requested content.
- Do not explain your answer.
- Do not use markdown headings.
- Keep the result natural and ready to copy/paste.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        result = (response.text or "").strip()

        return jsonify({
            "success": True,
            "type": content_type,
            "mood": mood,
            "caption": result,
            "hashtags": ""
        })

    except Exception as e:

        error_text = str(e)

        if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
            return jsonify({
                "success": False,
                "message": "AI limit reached. Please try again later.",
                "error": "AI generation quota exceeded."
            }), 429

        return jsonify({
            "success": False,
            "message": "AI content generation failed. Please try again.",
            "error": error_text
        }), 500

init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
