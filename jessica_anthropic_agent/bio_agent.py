import os
import requests
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Anthropic client
api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError(
        "ANTHROPIC_API_KEY not found. Please set it in your .env file or as an environment variable."
    )

client = Anthropic(api_key=api_key)

# Define tools
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


# Tool implementation functions
def search_pubmed(term, max_results=3):
    """Search PubMed and return article summaries."""
    try:
        # Search for article IDs
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

        # Fetch article details
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


def process_query(term, page_context, difficulty_level="undergrad"):
    """
    Main function to process a user query with the agent.

    Args:
        term: The biological term to explain
        page_context: Context from the webpage (title, URL, surrounding text)
        difficulty_level: One of "high_school", "undergrad", "expert", "eli5"

    Returns:
        The agent's explanation
    """
    difficulty_prompts = {
        "high_school": "Explain like I'm in high school biology",
        "undergrad": "Explain at an undergraduate level with some technical detail",
        "expert": "Use technical terminology, I'm familiar with biology",
        "eli5": "Explain like I'm 5, use simple analogies"
    }

    system_prompt = f"""You are a biology tutor explaining concepts clearly.

Difficulty level: {difficulty_prompts.get(difficulty_level, difficulty_prompts["undergrad"])}

Current page context:
Title: {page_context.get('title', 'Unknown')}
URL: {page_context.get('url', 'Unknown')}
Context: {page_context.get('surrounding_text', 'None')}

Your job:
1. Use the tools to fetch accurate, current information
2. Synthesize it into a clear explanation (2-3 paragraphs)
3. Use plain English and relatable examples
4. Provide links to sources
5. Connect the explanation to what they're reading

Be concise but thorough."""

    messages = [
        {
            "role": "user",
            "content": f"Explain '{term}' in the context of what I'm reading."
        }
    ]

    # Agent loop
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

        # If Claude wants to use tools
        if response.stop_reason == "tool_use":
            # Add Claude's response to messages
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Execute all requested tools
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input

                    print(f"🔧 Calling tool: {tool_name} with input: {tool_input}")

                    result = execute_tool(tool_name, tool_input)

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    })

            # Add tool results to messages
            messages.append({
                "role": "user",
                "content": tool_results
            })

        # If Claude is done, return the final answer
        elif response.stop_reason == "end_turn":
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text += block.text

            return final_text

        else:
            # Unexpected stop reason
            return f"Unexpected stop reason: {response.stop_reason}"


# Example usage
if __name__ == "__main__":
    # Test the agent
    page_context = {
        "title": "COVID-19 Treatment Options",
        "url": "https://example.com/covid-treatments",
        "surrounding_text": "Recent studies have shown that monoclonal antibodies can be effective in treating severe cases..."
    }

    result = process_query(
        term="monoclonal antibody",
        page_context=page_context,
        difficulty_level="undergrad"
    )

    print("\n" + "=" * 50)
    print("RESULT:")
    print("=" * 50)
    print(result)