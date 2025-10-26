import requests
import json

# Make sure your server is running first!
SERVER_URL = "http://127.0.0.1:5000"


def test_health():
    """Test if server is running."""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response text: {response.text}")
        print(f"Response: {response.json()}\n")
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server!")
        print(f"   Make sure server is running on {SERVER_URL}")
        print("   Run 'python server.py' in another terminal first")
        exit(1)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print(f"   Response text: {response.text}")
        exit(1)


def test_explain(term, difficulty="undergrad", length="brief"):
    """Test the explain endpoint."""
    print(f"🔍 Testing explain endpoint for: '{term}'")
    print(f"Difficulty: {difficulty}, Length: {length}\n")

    payload = {
        "term": term,
        "page_context": {
            "title": "Biology Research Article",
            "url": "https://example.com/research",
            "surrounding_text": f"This article discusses {term} in detail..."
        },
        "difficulty_level": difficulty,
        "length": length
    }

    print("Sending request...")
    response = requests.post(
        f"{SERVER_URL}/explain",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"Status: {response.status_code}\n")

    if response.status_code == 200:
        result = response.json()
        print("=" * 60)
        print(f"TERM: {result['term']}")
        print(f"LENGTH: {result['length']} | DIFFICULTY: {result['difficulty_level']}")
        print("=" * 60)
        print(result['explanation'])
        print("=" * 60)
    else:
        print(f"Error: {response.text}")


def test_tools():
    """Test the tools listing endpoint."""
    print("🔍 Testing tools endpoint...")
    response = requests.get(f"{SERVER_URL}/tools")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Available tools: {data['tools']}\n")


if __name__ == "__main__":
    print("🧪 Bio for Dummies Agent - Test Suite\n")

    # Test 1: Health check
    test_health()

    # Test 2: List available tools
    test_tools()

    # Test 3: Explain a term
    test_explain("cytokine storm", difficulty="undergrad")

    # Test 4: Try different difficulty levels
    print("\n" + "=" * 60)
    print("Testing different difficulty levels...")
    print("=" * 60 + "\n")

    test_explain("CRISPR", difficulty="eli5")