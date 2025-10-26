from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from anthropic import Anthropic

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow browser extension to call this API

# Initialize Anthropic client
api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError("API_KEY not found in environment variables")

client = Anthropic(api_key=api_key)

# Tool definitions
tools = [
    {
        "name": "search_pubmed",
        "description": "Search PubMed for peer-reviewed scientific papers and abstracts about biological/medical terms",
        "input_schema": {
            "type": "object",
            "properties": {
                "term": {
                    "type": "string",
                    "description": "The biological term to search for"
                },
                "max_results": {
                    "type": "integer",
                    "default": 3,
                    "description": "Number of papers to retrieve"
                }
            },
            "required": ["term"]
        }
    },
    {
        "name": "get_wikipedia_summary",
        "description": "Get a concise Wikipedia summary of a biological term or concept",
        "input_schema": {
            "type": "object",
            "properties": {
                "term": {
                    "type": "string",
                    "description": "The biological term to look up"
                }
            },
            "required": ["term"]
        }
    },
    {
        "name": "search_uniprot",
        "description": "Search UniProt database for protein information (function, structure, interactions)",
        "input_schema": {
            "type": "object",
            "properties": {
                "protein_name": {
                    "type": "string",
                    "description": "Name of the protein to search for"
                }
            },
            "required": ["protein_name"]
        }
    }
]


# Tool implementations
def search_pubmed(term, max_results=3):
    """Search PubMed and return article summaries."""
    try:
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": term,
            "retmax": max_results,
            "retmode": "json"
        }
        search_response = requests.get(search_url, params=search_params)
        search_data = search_response.json()

        ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not ids:
            return {"error": "No results found"}

        summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "retmode": "json"
        }
        summary_response = requests.get(summary_url, params=summary_params)
        summary_data = summary_response.json()

        return summary_data.get("result", {})

    except Exception as e:
        return {"error": str(e)}


def get_wikipedia_summary(term):
    """Get Wikipedia summary for a term."""
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(term)}"
        response = requests.get(url)
        data = response.json()

        return {
            "title": data.get("title"),
            "summary": data.get("extract"),
            "url": data.get("content_urls", {}).get("desktop", {}).get("page")
        }

    except Exception as e:
        return {"error": str(e)}


def search_uniprot(protein_name):
    """Search UniProt for protein information."""
    try:
        url = "https://rest.uniprot.org/uniprotkb/search"
        params = {
            "query": protein_name,
            "format": "json",
            "size": 3
        }
        response = requests.get(url, params=params)
        return response.json()

    except Exception as e:
        return {"error": str(e)}


# Map tool names to functions
tool_functions = {
    "search_pubmed": search_pubmed,
    "get_wikipedia_summary": get_wikipedia_summary,
    "search_uniprot": search_uniprot
}


def execute_tool(tool_name, tool_input):
    """Execute a tool by name with given input."""
    if tool_name in tool_functions:
        return tool_functions[tool_name](**tool_input)
    else:
        return {"error": f"Unknown tool: {tool_name}"}


def process_query(term, page_context, difficulty_level="undergrad", length="brief"):
    """Process a user query with the agent."""
    difficulty_prompts = {
        "high_school": "Explain like I'm in high school biology",
        "undergrad": "Explain at an undergraduate level with some technical detail",
        "expert": "Use technical terminology, I'm familiar with biology",
        "eli5": "Explain like I'm 5, use simple analogies"
    }

    length_prompts = {
        "brief": "Give a concise 1-2 sentence definition. Be direct and clear.",
        "short": "Provide a short explanation in 1 paragraph (3-4 sentences).",
        "medium": "Provide a medium explanation in 2-3 paragraphs with key details.",
        "detailed": "Provide a comprehensive explanation with multiple paragraphs, examples, and context."
    }

    system_prompt = f"""You are a biology tutor explaining concepts clearly.

Difficulty level: {difficulty_prompts.get(difficulty_level, difficulty_prompts["undergrad"])}
Length requirement: {length_prompts.get(length, length_prompts["brief"])}

Current page context:
Title: {page_context.get('title', 'Unknown')}
URL: {page_context.get('url', 'Unknown')}
Context: {page_context.get('surrounding_text', 'None')}

Your job:
1. Use the tools to fetch accurate, current information
2. Synthesize it into a clear explanation following the length requirement above
3. Use plain English and relatable examples
4. Provide links to sources when appropriate
5. Connect the explanation to what they're reading

IMPORTANT: Strictly follow the length requirement. Do not exceed it."""

    messages = [
        {
            "role": "user",
            "content": f"Explain '{term}' in the context of what I'm reading."
        }
    ]

    print(f"\n🔍 Processing query: {term}")

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            system=system_prompt,
            tools=tools,
            messages=messages
        )

        print(f"Stop reason: {response.stop_reason}")

        if response.stop_reason == "tool_use":
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input

                    print(f"🔧 Calling tool: {tool_name}")

                    result = execute_tool(tool_name, tool_input)

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    })

            messages.append({
                "role": "user",
                "content": tool_results
            })

        elif response.stop_reason == "end_turn":
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text += block.text

            return final_text

        else:
            return f"Unexpected stop reason: {response.stop_reason}"


# API Endpoints
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Bio for Dummies Agent is running"})


@app.route('/explain', methods=['POST'])
def explain():
    """
    Main endpoint to explain a biological term.

    Expected JSON body:
    {
        "term": "cytokine storm",
        "page_context": {
            "title": "COVID-19 Research",
            "url": "https://example.com",
            "surrounding_text": "...context around the term..."
        },
        "difficulty_level": "undergrad",  // optional
        "length": "brief"  // optional: "brief", "short", "medium", "detailed"
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data or 'term' not in data:
            return jsonify({
                "error": "Missing required field: 'term'"
            }), 400

        term = data['term']
        page_context = data.get('page_context', {})
        difficulty_level = data.get('difficulty_level', 'undergrad')
        length = data.get('length', 'brief')

        # Process the query
        explanation = process_query(term, page_context, difficulty_level, length)

        return jsonify({
            "term": term,
            "explanation": explanation,
            "difficulty_level": difficulty_level,
            "length": length
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/tools', methods=['GET'])
def list_tools():
    """List available tools."""
    return jsonify({
        "tools": [tool["name"] for tool in tools],
        "details": tools
    })


if __name__ == '__main__':
    print("🚀 Starting Bio for Dummies Agent Server...")
    print("📍 Server will run on http://localhost:5000")
    print("📖 API Documentation:")
    print("   GET  /health  - Check if server is running")
    print("   POST /explain - Explain a biological term")
    print("   GET  /tools   - List available tools")
    app.run(debug=True, port=5000)