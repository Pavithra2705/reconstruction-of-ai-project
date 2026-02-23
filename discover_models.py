#!/usr/bin/env python3
"""
Gemini API Model Discovery Script
This will show you EXACTLY which models are available with your API key
"""

import os
import sys

def check_models():
    print("=" * 70)
    print("GEMINI API - MODEL DISCOVERY TOOL")
    print("=" * 70)
    
    # Step 1: Check package
    print("\n📦 Step 1: Checking google-generativeai package...")
    try:
        import google.generativeai as genai
        print("   ✅ Package installed")
    except ImportError:
        print("   ❌ Package NOT installed")
        print("   💡 Install it: pip install google-generativeai")
        return False
    
    # Step 2: Get API key
    print("\n🔑 Step 2: Locating API key...")
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        # Try reading from secrets.toml
        try:
            with open('.streamlit/secrets.toml', 'r') as f:
                for line in f:
                    if 'GEMINI_API_KEY' in line or 'GOOGLE_API_KEY' in line:
                        api_key = line.split('=')[1].strip().strip('"').strip("'")
                        break
        except:
            pass
    
    if not api_key:
        print("   ❌ No API key found")
        print("\n   💡 Set your API key:")
        print("      Option 1: export GEMINI_API_KEY='your-key-here'")
        print("      Option 2: Create .streamlit/secrets.toml with:")
        print("                GEMINI_API_KEY = 'your-key-here'")
        print("\n   🌐 Get API key from: https://makersuite.google.com/app/apikey")
        return False
    
    print(f"   ✅ API key found (starts with: {api_key[:10]}...)")
    
    # Step 3: Configure API
    print("\n⚙️  Step 3: Configuring Gemini API...")
    try:
        genai.configure(api_key=api_key)
        print("   ✅ API configured successfully")
    except Exception as e:
        print(f"   ❌ Configuration failed: {e}")
        return False
    
    # Step 4: List ALL models
    print("\n📋 Step 4: Discovering ALL available models...")
    print("-" * 70)
    
    all_models = []
    generate_models = []
    
    try:
        for model in genai.list_models():
            all_models.append(model.name)
            
            print(f"\n   Model: {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
            
            if 'generateContent' in model.supported_generation_methods:
                generate_models.append(model.name)
                print(f"   ✅ CAN USE for generateContent")
            else:
                print(f"   ❌ Cannot use for generateContent")
            
            print(f"   Input Token Limit: {model.input_token_limit}")
            print(f"   Output Token Limit: {model.output_token_limit}")
            print("-" * 70)
        
    except Exception as e:
        print(f"   ❌ Failed to list models: {e}")
        print("\n   💡 Possible reasons:")
        print("      - Invalid API key")
        print("      - Network connection issue")
        print("      - API service unavailable")
        return False
    
    # Summary
    print(f"\n📊 SUMMARY:")
    print(f"   Total models found: {len(all_models)}")
    print(f"   Models supporting generateContent: {len(generate_models)}")
    
    if generate_models:
        print("\n✅ USABLE MODELS FOR YOUR CHATBOT:")
        for i, model in enumerate(generate_models, 1):
            print(f"   {i}. {model}")
    else:
        print("\n❌ No models available for content generation!")
        print("   This is unusual - please check:")
        print("   - Your API key permissions")
        print("   - API billing/quota status")
        return False
    
    # Step 5: Test the first available model
    print("\n🧪 Step 5: Testing content generation...")
    if generate_models:
        test_model_name = generate_models[0]
        print(f"   Testing with: {test_model_name}")
        
        try:
            model = genai.GenerativeModel(test_model_name)
            response = model.generate_content("Say hello in exactly 3 words")
            print(f"   ✅ SUCCESS! Response: {response.text}")
            
        except Exception as e:
            print(f"   ❌ Test failed: {e}")
            return False
    
    # Step 6: Recommend configuration
    print("\n" + "=" * 70)
    print("✅ CONFIGURATION SUCCESSFUL!")
    print("=" * 70)
    
    print("\n📝 RECOMMENDED CHATBOT CONFIGURATION:")
    print(f"\nUse this model name in your code:")
    print(f"   model_name = '{generate_models[0]}'")
    
    print("\n💡 For automatic selection, use this priority list:")
    print("   preferred_models = [")
    for model in generate_models[:3]:  # Show top 3
        print(f"       '{model}',")
    print("   ]")
    
    print("\n🎉 Your Gemini API is ready to use!")
    print("=" * 70)
    
    return True


def create_config_file(models):
    """Create a config file with the discovered models"""
    print("\n💾 Creating gemini_config.json...")
    
    import json
    
    config = {
        "discovered_at": str(datetime.now()),
        "available_models": models,
        "recommended_model": models[0] if models else None,
        "backup_models": models[1:3] if len(models) > 1 else []
    }
    
    try:
        with open('gemini_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        print("   ✅ Created gemini_config.json")
    except Exception as e:
        print(f"   ⚠️  Could not create config: {e}")


if __name__ == "__main__":
    from datetime import datetime
    
    print("\n🚀 Starting Gemini API diagnosis...\n")
    
    success = check_models()
    
    if success:
        print("\n✅ Everything looks good! You can now use the chatbot.")
        print("   Run your main application: streamlit run main.py")
    else:
        print("\n❌ Setup incomplete. Please follow the suggestions above.")
        print("\n📚 Additional resources:")
        print("   - Gemini API Docs: https://ai.google.dev/docs")
        print("   - Get API Key: https://makersuite.google.com/app/apikey")
        print("   - Python SDK: https://ai.google.dev/tutorials/python_quickstart")
    
    print("\n")
    sys.exit(0 if success else 1)
