import json
import os
from openai import OpenAI
from prompts.daxtra_format_extraction_v1 import SYSTEM_PROMPT, EXTRACTION_PROMPT

client = OpenAI()

def build_cot_user_prompt(resume_text):
    """Prepend the ultrathink CoT instruction to the extraction prompt."""
    cot_prefix = (
        "Think step by step before extracting. "
        "Write your full reasoning in a <thinking> block, "
        "then output the JSON in a <json> block.\n\n"
    )
    return cot_prefix + EXTRACTION_PROMPT.replace("{resume_text}", resume_text[:25000])

def generate_batch_file(input_jsonl, output_batch_jsonl, model="gpt-4o"):
    """
    input_jsonl: file with lines {"id": "...", "text": "..."}
    output_batch_jsonl: formatted for OpenAI Batch API
    """
    batch_requests = []
    with open(input_jsonl, "r") as f:
        for line in f:
            data = json.loads(line)
            resume_id = data.get("id", "unknown")
            resume_text = data.get("text", "")
            
            batch_requests.append({
                "custom_id": f"resume-{resume_id}",
                "method": "POST",
                "url": "/v1/chat/completions",
                "body": {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": build_cot_user_prompt(resume_text)}
                    ],
                    "temperature": 0.0,
                    "max_tokens": 16000,
                }
            })

    with open(output_batch_jsonl, "w") as f:
        for req in batch_requests:
            f.write(json.dumps(req) + "\n")
    
    print(f"Prepared {len(batch_requests)} requests in {output_batch_jsonl}")

if __name__ == "__main__":
    # Example usage:
    # generate_batch_file("data/raw_resumes.jsonl", "data/batch_requests.jsonl")
    pass
