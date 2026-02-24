import os
import pdfplumber
import pandas as pd
from pymongo import MongoClient
import glob

# -----------------------------
# CONFIGURATION
# -----------------------------
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "saarthi_nexus"
COLLECTION_NAME = "placement_records"
PDF_DIR = r"c:\Users\ABHIJIT\Desktop\SAARTHI_NEXUS"

# -----------------------------
# HELPER FUNCTIONS
# -----------------------------
def safe_float(value):
    try:
        val_str = str(value).strip().replace(',', '')
        return float(val_str)
    except:
        return 0.0

def safe_int(value):
    try:
        val_str = str(value).strip().replace(',', '')
        return int(float(val_str))
    except:
        return 0

def get_academic_year(filename):
    """
    Extracts year from filename like 'Placement Report 2023-24.pdf'
    or 'Placement-Report_2017-18.pdf'
    """
    # Simple heuristic: find a pattern like YYYY-YY
    import re
    match = re.search(r'20\d{2}-\d{2}', filename)
    if match:
        return match.group(0)
    return "Unknown-Year"

# -----------------------------
# PDF EXTRACTION LOGIC
# -----------------------------
def extract_data_from_pdf(pdf_path, academic_year):
    print(f"Processing {pdf_path} for year {academic_year}...")
    records = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            
            for table in tables:
                # table is a list of lists (rows)
                # We need to skip header rows. Usually headers contain "Company" or "Sr. No."
                for row_idx, row in enumerate(table):
                    # Basic validation: Row must have enough columns
                    # Adjust this threshold based on the actual PDF table structure
                    if not row or len(row) < 5: 
                        continue
                        
                    # Clean None values to empty strings
                    row = [str(cell) if cell is not None else "" for cell in row]
                    
                    # Detect Header Row to skip
                    if "Company" in row[1] or "Sr." in row[0]:
                        continue
                    
                    # Detect Summary/Total rows to skip
                    if "Total" in row[1] or "Grand Total" in row[1]:
                        continue
                        
                    company_name = row[1].strip()
                    if not company_name:
                        continue
                    
                    # Mapping based on typical comprehensive report structure:
                    # [0]: Sr No.
                    # [1]: Company Name
                    # [2]: Criteria / Salary? NO, usually Criteria is early, Salary is late.
                    # WARNING: Column indexes vary by report year. This is a best-effort generic mapping
                    # tailored to the user's provided snippet example.
                    
                    # User Example mapping:
                    # row[-3] -> Salary
                    # row[-1] -> Total Salary (Package * Students)
                    # row[2] -> Criteria (CGPA)
                    # row[3] -> CE
                    # row[4] -> IT
                    # row[5] -> E&TC
                    # row[6] -> Male
                    # row[7] -> Female
                    # row[8] -> Total Selected
                    
                    # Try-Catch per row to avoid crashing on meaningful structure variations
                    try:
                        salary_lpa = safe_float(row[-3])
                        
                        doc = {
                            "_id": f"{academic_year}_{company_name}",
                            "academic_year": academic_year,
                            "company_name": company_name,
                            "category": "Group I" if salary_lpa >= 6 else "Group II",
                            "salary_lpa": salary_lpa,
                            "visit_date": "Unknown", # Extracting date is trickier, often column 9 or similar
                            "criteria": {
                                "min_cgpa": safe_float(row[2]) if len(row) > 2 else 0.0,
                                "eligible_branches": ["CE", "IT", "E&TC"]
                            },
                            "selections": {
                                "CE": safe_int(row[3]) if len(row) > 3 else 0,
                                "IT": safe_int(row[4]) if len(row) > 4 else 0,
                                "E&TC": safe_int(row[5]) if len(row) > 5 else 0
                            },
                            "gender_distribution": {
                                "male": safe_int(row[6]) if len(row) > 6 else 0,
                                "female": safe_int(row[7]) if len(row) > 7 else 0,
                                "total": safe_int(row[8]) if len(row) > 8 else 0
                            },
                            "total_salary_lpa": safe_float(row[-1])
                        }
                        
                        # Only add if valid company and stats
                        if doc['company_name']: 
                            records.append(doc)
                            
                    except Exception as e:
                        # print(f"Skipping row in {academic_year} due to error: {e}")
                        pass
                        
    return records

# -----------------------------
# MAIN EXECUTION
# -----------------------------
def main():
    # Connect
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    # 1. Clear Collection
    collection.delete_many({})
    print("Cleared existing 'placement_records' collection.")

    # 2. Find and Process PDFs
    pdf_pattern = os.path.join(PDF_DIR, "Placement*Report*.pdf")
    pdf_files = glob.glob(pdf_pattern)
    
    total_inserted = 0
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        year = get_academic_year(filename)
        
        if year == "Unknown-Year":
            print(f"Skipping {filename} (Could not parse year)")
            continue
            
        try:
            data = extract_data_from_pdf(pdf_path, year)
            if data:
                # Insert
                try:
                    # Ordered=False allows continuing if one doc fails (e.g. slight duplicate)
                    collection.insert_many(data, ordered=False)
                    print(f"  -> Inserted {len(data)} records for {year}")
                    total_inserted += len(data)
                except Exception as e:
                    print(f"  -> Partial insertion error for {year}: {e}")
            else:
                print(f"  -> No data extracted for {year}")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"SUCCESS: Extracted and inserted {total_inserted} total records.")

if __name__ == "__main__":
    main()
