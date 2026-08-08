
import os
from pypdf import PdfReader

def extract_text_from_pdfs():
    # Use absolute path to the PDFs directory (parent of current script)
    base_dir = r"c:\Users\ABHIJIT\Desktop\SAARTHI_NEXUS"
    output_file = r"c:\Users\ABHIJIT\Desktop\SAARTHI_NEXUS\backend\pdf_dump.txt"
    
    pdf_files = [f for f in os.listdir(base_dir) if f.lower().endswith('.pdf')]
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for pdf_file in pdf_files:
            try:
                full_path = os.path.join(base_dir, pdf_file)
                reader = PdfReader(full_path)
                
                outfile.write(f"\n--- Start of {pdf_file} ---\n")
                
                # Extract text from ALL pages
                num_pages = len(reader.pages)
                for i in range(num_pages):
                    page = reader.pages[i]
                    text = page.extract_text()
                    if text:
                        outfile.write(text + "\n")
                
                outfile.write(f"\n--- End of {pdf_file} ---\n")
                
            except Exception as e:
                outfile.write(f"Error reading {pdf_file}: {e}\n")

if __name__ == "__main__":
    extract_text_from_pdfs()
