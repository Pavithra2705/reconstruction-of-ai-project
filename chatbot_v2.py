# chatbot.py

import google.generativeai as genai
import os
import json


class LLaMAChat:
    """
    NOTE:
    Class name kept as LLaMAChat ONLY to match main.py
    Internally this uses Google Gemini API with automatic model discovery
    """

    def __init__(self):
        # Try environment variables for API key
        api_key = "AIzaSyAjCnPXp1R9BxsXBrNkwD3OWUHJvLR8eOo"
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found.\n\n"
                "Please set it in one of these ways:\n"
                "1. Environment variable: export GEMINI_API_KEY='your-key'\n"
                "2. Windows: setx GEMINI_API_KEY \"your-key\"\n"
                "3. Get your key from: https://makersuite.google.com/app/apikey"
            )

        genai.configure(api_key=api_key)

        # Discover available models automatically
        self.model = self._initialize_model()

    def _initialize_model(self):
        """
        Automatically discover a Gemini model that supports generateContent
        This avoids hardcoded model names and prevents 404 errors
        """
        try:
            print("Discovering available Gemini models (v1beta safe)...")

            for model in genai.list_models():
                if "generateContent" in model.supported_generation_methods:
                    print(f"Using model: {model.name}")
                    return genai.GenerativeModel(
                        model_name=model.name,
                        generation_config={
                            "temperature": 0.7,
                            "top_p": 0.95,
                            "top_k": 40,
                            "max_output_tokens": 4096,
                        },
                    )

            raise RuntimeError("No Gemini models support generateContent")

        except Exception as e:
            raise RuntimeError(
                "Gemini initialization failed.\n"
                f"Reason: {str(e)}\n\n"
                "Fixes:\n"
                "- Ensure API key is valid\n"
                "- Enable Generative Language API\n"
                "- Restart the application"
            )

    def generate_response(self, user_question: str, context: dict) -> str:
        """
        Generate response using dataset context with proper error handling
        """

        prompt = f"""
You are a professional Data Analyst assisting non-technical users.

You are given information about a dataset (columns, size, missing values, summaries, and samples).
Answer the user's question in a SIMPLE, CLEAR, and PRACTICAL way.

GUIDELINES:
- Use plain English that anyone can understand
- Avoid technical jargon unless absolutely necessary
- Focus on insights and meaning, not theory
- Explain results as if speaking to a beginner
- Use short bullet points where helpful
- Refer to column names when relevant
- If exact calculations are not provided, give a reasonable high-level explanation
- Never say “I cannot answer” unless it is truly impossible
- Do NOT mention missing data, limitations, or internal calculations unless asked
- End with a short, helpful suggestion if further analysis can improve the answer

DATA CONTEXT:
{context}

USER QUESTION:
{user_question}

ANSWER:

DATASET INFORMATION:
- Shape: {context.get('shape', 'Unknown')}
- Columns: {', '.join(context.get('columns', []))}
- Data Types: Available
- Missing Values: {sum(context.get('missing_values', {}).values())} total

DETAILED CONTEXT:
{json.dumps(context, indent=2, default=str)}

USER QUESTION:
{user_question}

INSTRUCTIONS:
- Answer like a friendly and practical data analyst
- Use SIMPLE, easy-to-understand language (no technical jargon)
- If exact calculations are not available, give a logical, high-level explanation
- Focus on WHAT THE USER SHOULD UNDERSTAND, not limitations
- Use short bullet points and clear insights
- Mention column names where helpful
- If deeper analysis is possible, suggest it politely at the end
- Do NOT say "I cannot", "not possible", or "insufficient data" unless absolutely required
- If possible, infer patterns using summaries and sample values


Your response:
"""

        try:
            response = self.model.generate_content(prompt)

            if not response.text:
                if hasattr(response, "prompt_feedback"):
                    return (
                        "⚠️ Response was blocked.\n\n"
                        f"Reason: {response.prompt_feedback}\n\n"
                        "Try rephrasing your question."
                    )
                return "⚠️ No response generated. Please try a different question."

            return response.text

        except Exception as e:
            error_msg = str(e)

            if "404" in error_msg:
                return (
                    "❌ Model not found error.\n\n"
                    "The Gemini model is unavailable. This usually means:\n"
                    "1. Your API key may have expired\n"
                    "2. The model version changed\n"
                    "3. API access issue\n\n"
                    "Please:\n"
                    "- Verify your API key at https://makersuite.google.com/app/apikey\n"
                    "- Restart the application\n"
                    "- Check your internet connection"
                )

            elif "quota" in error_msg.lower():
                return (
                    "❌ API quota exceeded.\n\n"
                    "You've reached your API usage limit.\n"
                    "Check your quota at: https://console.cloud.google.com/"
                )

            elif "invalid" in error_msg.lower() and "key" in error_msg.lower():
                return (
                    "❌ Invalid API key.\n\n"
                    "Please check your GEMINI_API_KEY and ensure it's valid.\n"
                    "Get a new key from: https://makersuite.google.com/app/apikey"
                )

            else:
                return (
                    f"❌ Error: {error_msg}\n\n"
                    "Troubleshooting:\n"
                    "1. Check your API key configuration\n"
                    "2. Verify internet connection\n"
                    "3. Try a simpler question\n"
                    "4. Restart the application"
                )


# Standalone chatbot interface (for testing)
if __name__ == "__main__":
    import streamlit as st

    st.set_page_config(
        page_title="AI Data Analyst Chatbot",
        page_icon="🤖",
        layout="centered",
    )

    st.title("🤖 AI Data Analyst Chatbot")
    st.caption("Powered by Google Gemini (Auto-configured)")

    if "chatbot_instance" not in st.session_state:
        with st.spinner("Initializing AI assistant..."):
            try:
                st.session_state.chatbot_instance = LLaMAChat()
                st.success("✅ AI assistant ready!")
            except Exception as e:
                st.error(str(e))
                st.stop()

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    user_prompt = st.chat_input("Ask anything about data analysis...")

    if user_prompt:
        st.session_state.messages.append(
            {"role": "user", "content": user_prompt}
        )

        with st.chat_message("user"):
            st.markdown(user_prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                mock_context = {
                    "shape": (0, 0),
                    "columns": [],
                    "dtypes": {},
                    "summary": {},
                    "missing_values": {},
                    "sample_data": {},
                }

                response = st.session_state.chatbot_instance.generate_response(
                    user_prompt, mock_context
                )

            st.markdown(response)

        st.session_state.messages.append(
            {"role": "assistant", "content": response}
        )

    with st.sidebar:
        st.header("⚙️ Settings")

        st.markdown(
            """
**Use cases:**
- Data analysis help
- Python & Pandas code
- Statistical concepts
- ML explanations
- Debugging assistance
"""
        )

        if st.button("🧹 Clear Chat"):
            st.session_state.messages = []
            st.rerun()

        st.markdown("---")
        st.markdown("**💡 Tips:**")
        st.markdown("- Ask specific questions")
        st.markdown("- Request code examples")
        st.markdown("- Get explanations")
        st.markdown("- Debug errors")

        st.markdown("---")
        st.caption("🔑 API configured automatically")
