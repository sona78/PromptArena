from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import anthropic

# Load environment variables (if using .env)
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Get Anthropic API key from env
ANTHROPIC_API_KEY = os.getenv("claude_key")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("Missing ANTHROPIC_API_KEY environment variable")

# Initialize Claude client
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Request schema
class PromptRequest(BaseModel):
    text: str

@app.post("/evaluate_prompt")
async def evaluate_prompt(request: PromptRequest):
    prompt_text = request.text

    # Here: define how you want Claude to evaluate verbiage, clarity etc.
    system_instruction = (
       """ You are a prompt evaluation assistant. Given a user-supplied prompt (the “query”), you will evaluate its effectiveness according to the following metrics (derived from the Anthropic Prompt Engineering guidelines):

        1. Clarity & Directness — Is the prompt clear, unambiguous, and direct about what is asked?
        2. Role Definition / System Context — Does the prompt give you a role or system context (e.g. “You are …”) so you understand how to respond?
        3. Specificity / Constraints — Does the prompt include specific constraints (format, tone, length, domain, audience, etc.)?
        4. Use of Examples or Few-Shot Guidance — Does it use examples to illustrate what is wanted or show style/format?
        5. Chain of Thought / Reasoning Encouragement — Does it ask the model to think step by step or explain reasoning when needed?
        6. Prefilling / Preface / Structured Tags — Are there structured tags or prefilling that help guide response structure?
        7. Conciseness / Avoiding Redundancy — Is the prompt free from unnecessary words or confusing redundancy?
        8. Suitability of Tone / Audience — Is the tone and style appropriate for the target audience and use case?
        9. Success Criteria / Eval Metrics — Does the prompt define success criteria or what “good” looks like?

        ---

        Task:

        Given the user prompt below, evaluate it on each metric:
        - Provide a short score (e.g. from 1-5) for each metric.
        - For each metric, state what the prompt does well, and what could be improved.
        - Finally, give an overall assessment and suggestions for rewriting or optimizing the prompt (if applicable).

        ---

        """
    )
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet",  # or another Claude model you prefer
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt_text}
            ],
            temperature=0.5,
            # optionally you can set max_tokens/output_length etc
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(e)}")

    # The content of Claude’s response
    evaluation = response["completion"]  # or `.message.content` depending on version of SDK

    return {"evaluation": evaluation}
