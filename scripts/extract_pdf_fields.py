#!/usr/bin/env python3
"""
PDF Field Extractor
Extracts all form fields from a PDF and outputs their properties.
"""

import sys
import requests
import PyPDF2
from io import BytesIO
import json

def extract_pdf_fields(pdf_url):
    """Extract all form fields from a PDF URL"""
    try:
        # Download the PDF
        print(f"Downloading PDF from: {pdf_url}")
        response = requests.get(pdf_url)
        response.raise_for_status()

        # Create PDF reader
        pdf_data = BytesIO(response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_data)

        print(f"PDF loaded. Pages: {len(pdf_reader.pages)}")

        # Check if PDF has form fields
        if not pdf_reader.get_fields():
            print("No form fields found in PDF")
            return {}

        # Extract field information
        fields = {}
        pdf_fields = pdf_reader.get_fields()

        print(f"Found {len(pdf_fields)} form fields:")

        for field_name, field_obj in pdf_fields.items():
            field_info = {
                'name': field_name,
                'type': str(type(field_obj).__name__),
                'value': str(field_obj.value) if field_obj.value is not None else None,
            }

            # Add additional properties based on field type
            if hasattr(field_obj, 'fieldType'):
                field_info['fieldType'] = field_obj.fieldType

            if hasattr(field_obj, 'options'):
                field_info['options'] = field_obj.options

            if hasattr(field_obj, 'checked'):
                field_info['checked'] = field_obj.checked

            fields[field_name] = field_info
            print(f"  - {field_name}: {field_info.get('fieldType', 'Unknown')}")

        return fields

    except Exception as e:
        print(f"Error extracting PDF fields: {e}")
        return {}

def main():
    if len(sys.argv) != 2:
        print("Usage: python extract_pdf_fields.py <pdf_url>")
        sys.exit(1)

    pdf_url = sys.argv[1]
    fields = extract_pdf_fields(pdf_url)

    if fields:
        # Output as JSON for easy parsing
        print("\n=== FIELD DETAILS ===")
        print(json.dumps(fields, indent=2))

        # Save to file
        with open('pdf_fields_extracted.json', 'w') as f:
            json.dump(fields, f, indent=2)
        print("\nSaved field details to: pdf_fields_extracted.json")

        # Summary
        field_types = {}
        for field_info in fields.values():
            field_type = field_info.get('fieldType', 'Unknown')
            field_types[field_type] = field_types.get(field_type, 0) + 1

        print("\n=== FIELD TYPE SUMMARY ===")
        for field_type, count in field_types.items():
            print(f"{field_type}: {count}")

    else:
        print("No fields extracted")

if __name__ == "__main__":
    main()