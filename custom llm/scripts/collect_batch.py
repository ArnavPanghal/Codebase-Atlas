import json
import time
from openai import OpenAI

client = OpenAI()

def poll_and_collect(batch_id, output_file="data/teacher_results.jsonl"):
    while True:
        batch = client.batches.retrieve(batch_id)
        completed = batch.request_counts.completed
        total = batch.request_counts.total
        print(f"Status: {batch.status} | {completed}/{total} completed")
        
        if batch.status in ("completed", "failed", "cancelled", "expired"):
            break
        time.sleep(60)

    if batch.status != "completed":
        print(f"Batch ended with status: {batch.status}")
        return

    # Download results
    result_text = client.files.content(batch.output_file_id).text
    results = []
    for line in result_text.strip().split("\n"):
        item = json.loads(line)
        if item["response"]["status_code"] == 200:
            content = item["response"]["body"]["choices"][0]["message"]["content"]
            thinking = ""
            json_text = content
            if "<thinking>" in content and "</thinking>" in content:
                thinking = content.split("<thinking>")[1].split("</thinking>")[0].strip()
            if "<json>" in content and "</json>" in content:
                json_text = content.split("<json>")[1].split("</json>")[0].strip()
            
            results.append({
                "custom_id": item["custom_id"],
                "thinking": thinking,
                "json_text": json_text,
            })

    with open(output_file, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    
    print(f"Saved {len(results)} results to {output_file}")

if __name__ == "__main__":
    # Example usage:
    # poll_and_collect("batch_id_here")
    pass
