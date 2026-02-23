# chatbot.py

import google.generativeai as genai
import os
import json

class LLaMAChat:
    """
    NOTE:
    Class name kept as LLaMAChat ONLY to match main.py
    Internally this uses Google Gemini API
    """

    def __init__(self):
        # Try multiple sources for API key
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY or GOOGLE_API_KEY not found. "
                "Set it as an environment variable or in Streamlit secrets."
            )

        genai.configure(api_key=api_key)

        # Use the correct stable model name
        try:
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash-latest",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
        except Exception as e:
            # Fallback to older stable version
            try:
                self.model = genai.GenerativeModel(
                    model_name="gemini-pro",
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 2048,
                    }
                )
            except Exception as e2:
                raise ValueError(
                    f"Failed to initialize Gemini model. "
                    f"Error 1: {str(e)}, Error 2: {str(e2)}"
                )

    def generate_response(self, user_question: str, context: dict) -> str:
        """
        Generate response using dataset context with proper error handling
        """

        # System instruction as part of prompt since constructor doesn't support it in all versions
        system_instruction = """You are an expert AI Data Analyst assistant. 
You analyze datasets, explain insights clearly, and answer questions using provided data context. 
Be concise, accurate, and practical."""

        prompt = f"""{system_instruction}

DATASET CONTEXT (JSON):
{json.dumps(context, indent=2, default=str)}

USER QUESTION:
{user_question}

INSTRUCTIONS:
- Analyze the dataset context provided above
- Answer the user's question using ONLY the given data
- Do NOT guess or hallucinate missing values
- If data is insufficient, clearly say so
- Use simple language suitable for non-technical users
- Prefer bullet points for clarity
- Mention column names explicitly when referencing data
- Avoid unnecessary explanations or filler text

Please provide your analysis:
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}\n\nPlease try:\n1. Check your API key\n2. Verify your internet connection\n3. Try a simpler question"


# Standalone chatbot for testing (optional)
if __name__ == "__main__":
    import streamlit as st

    # ---------------- CONFIG ----------------
    st.set_page_config(
        page_title="AI Data Analyst Chatbot",
        page_icon="🤖",
        layout="centered"
    )

    # ---------------- GEMINI SETUP ----------------
    try:
        # Try to get API key from secrets first, then environment
        if hasattr(st, 'secrets') and "GEMINI_API_KEY" in st.secrets:
            api_key = st.secrets["GEMINI_API_KEY"]
        elif hasattr(st, 'secrets') and "GOOGLE_API_KEY" in st.secrets:
            api_key = st.secrets["GOOGLE_API_KEY"]
        else:
            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if not api_key:
            st.error("⚠️ API Key not found! Please set GEMINI_API_KEY in .streamlit/secrets.toml or as environment variable.")
            st.stop()

        genai.configure(api_key=api_key)

        # Try to initialize with latest model first
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash-latest",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
            st.caption("Using: gemini-1.5-flash-latest")
        except:
            # Fallback to gemini-pro
            model = genai.GenerativeModel(
                model_name="gemini-pro",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
            st.caption("Using: gemini-pro")

    except Exception as e:
        st.error(f"Failed to initialize Gemini: {str(e)}")
        st.stop()

    # ---------------- SESSION STATE ----------------
    if "chat" not in st.session_state:
        st.session_state.chat = model.start_chat(history=[])

    if "messages" not in st.session_state:
        st.session_state.messages = []

    # ---------------- UI ----------------
    st.title("🤖 AI Data Analyst Chatbot")
    st.caption("Powered by Google Gemini")

    # Display previous messages
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # ---------------- USER INPUT ----------------
    user_prompt = st.chat_input("Ask anything about data analysis...")

    if user_prompt:
        # User message
        st.session_state.messages.append(
            {"role": "user", "content": user_prompt}
        )

        with st.chat_message("user"):
            st.markdown(user_prompt)

        # Gemini response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    response = st.session_state.chat.send_message(user_prompt)
                    reply = response.text
                except Exception as e:
                    reply = f"Error: {str(e)}\n\nPlease try:\n1. Check your API key\n2. Verify internet connection\n3. Try a simpler question"

            st.markdown(reply)

        # Save assistant message
        st.session_state.messages.append(
            {"role": "assistant", "content": reply}
        )

    # ---------------- SIDEBAR ----------------
    with st.sidebar:
        st.header("⚙️ Settings")
        st.markdown(
            """
            **Use cases:**
            - Data analysis help  
            - Python & Pandas  
            - ML concepts  
            - Project explanations  
            - Interview prep  
            """
        )

        if st.button("🧹 Clear Chat"):
            st.session_state.messages = []
            st.session_state.chat = model.start_chat(history=[])
            st.rerun()

        st.markdown("---")
        st.markdown("**💡 Tips:**")
        st.markdown("- Ask specific questions about your data")
        st.markdown("- Request code examples")
        st.markdown("- Ask for explanations of concepts")
        st.markdown("- Get help with debugging")
