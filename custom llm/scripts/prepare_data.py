import json
import os
import glob

def prepare_jsonl_from_folder(folder_path, output_jsonl):
    """
    Reads all .txt files in folder_path and writes to output_jsonl.
    """
    resumes = []
    # Adjust extension as needed (e.g., .txt, .pdf converted to text, etc.)
    files = glob.glob(os.path.join(folder_path, "*.txt"))
    
    if not files:
        print(f"No .txt files found in {folder_path}")
        return

    with open(output_jsonl, "w") as f:
        for i, file_path in enumerate(files):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as rf:
                text = rf.read()
                data = {
                    "id": os.path.basename(file_path),
                    "text": text
                }
                f.write(json.dumps(data) + "\n")
                
    print(f"Converted {len(files)} files to {output_jsonl}")

if __name__ == "__main__":
    # Example usage:
    # prepare_jsonl_from_folder("data/raw_texts", "data/raw_resumes.jsonl")
    pass
