import json
import os
from openai import OpenAI

client = OpenAI()

ROLES = [
    "Full Stack Developer", "Data Scientist", "Project Manager", 
    "DevOps Engineer", "Marketing Manager", "Sales Representative",
    "UX/UI Designer", "Business Analyst", "Solutions Architect"
]

def generate_synthetic_resume(role):
    prompt = (
        f"Generate a realistic, detailed resume for a {role}. "
        "Include a summary, several work history items with dates, "
        "education, and a comprehensive list of skills. "
        "Output ONLY the plain text of the resume, as if it was extracted from a PDF."
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8
    )
    return response.choices[0].message.content

def bootstrap_dataset(count_per_role=5, output_file="data/raw_resumes.jsonl"):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    resumes = []
    
    total = len(ROLES) * count_per_role
    print(f"Generating {total} synthetic resumes...")

    with open(output_file, "w") as f:
        for role in ROLES:
            for i in range(count_per_role):
                print(f"Generating for {role} ({i+1}/{count_per_role})...")
                text = generate_synthetic_resume(role)
                data = {
                    "id": f"synthetic-{role.replace(' ', '-')}-{i}",
                    "text": text
                }
                f.write(json.dumps(data) + "\n")
                
    print(f"Finished generating {total} resumes to {output_file}")

if __name__ == "__main__":
    # bootstrap_dataset(count_per_role=2) # Generate ~18 resumes for a test run
    pass
