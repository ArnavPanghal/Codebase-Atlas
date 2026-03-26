import json
import os
import glob
import fitz  # PyMuPDF
import argparse

def extract_robust_text(pdf_path):
    """
    Extracts text using 'blocks' to maintain reading order in multi-column layouts.
    """
    try:
        doc = fitz.open(pdf_path)
        full_text = []
        for page in doc:
            # Get text blocks: (x0, y0, x1, y1, "text", block_no, block_type)
            blocks = page.get_text("blocks")
            # Sort blocks: primary by y0 (vertical), secondary by x0 (horizontal)
            blocks.sort(key=lambda b: (b[1], b[0]))
            for b in blocks:
                if b[6] == 0:  # 0 is text, 1 is image
                    full_text.append(b[4].strip())
        
        text = "\n\n".join(full_text)
        if not text.strip():
            print(f"Warning: {pdf_path} extracted no text. It might be a scanned image.")
        return text
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return None

def process_resume_pdfs(input_folder, output_jsonl):
    """
    Iterates through all .pdf files in input_folder and writes to output_jsonl.
    """
    pdf_files = glob.glob(os.path.join(input_folder, "*.pdf"))
    if not pdf_files:
        print(f"No .pdf files found in {input_folder}")
        return

    os.makedirs(os.path.dirname(output_jsonl), exist_ok=True)
    
    count = 0
    with open(output_jsonl, "w") as f:
        for pdf_path in pdf_files:
            print(f"Processing {pdf_path}...")
            text = extract_robust_text(pdf_path)
            if text:
                data = {
                    "id": os.path.basename(pdf_path),
                    "text": text
                }
                f.write(json.dumps(data) + "\n")
                count += 1
                
    print(f"Successfully processed {count}/{len(pdf_files)} PDFs into {output_jsonl}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract text from resume PDFs into JSONL.")
    parser.add_argument("--input_folder", required=True, help="Folder containing PDF resumes.")
    parser.add_argument("--output_jsonl", required=True, help="Output JSONL file path.")
    
    args = parser.parse_args()
    process_resume_pdfs(args.input_folder, args.output_jsonl)
