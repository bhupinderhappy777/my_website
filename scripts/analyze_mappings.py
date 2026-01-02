#!/usr/bin/env python3
"""
Analyze PDF fields vs current mappings to identify missing/incorrect mappings
"""

import json
import sys

def load_json_file(filepath):
    """Load JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_mappings(pdf_fields, field_mappings):
    """Analyze which PDF fields are mapped and which are missing"""

    # Get all PDF field names
    pdf_field_names = {field['name'] for field in pdf_fields}

    # Get all mapped PDF fields
    mapped_pdf_fields = set()
    for mapping in field_mappings.values():
        if isinstance(mapping, dict) and 'pdf_field' in mapping:
            mapped_pdf_fields.add(mapping['pdf_field'])
        elif isinstance(mapping, dict) and 'value_map' in mapping:
            # Add all values from value_map
            for value in mapping['value_map'].values():
                mapped_pdf_fields.add(value)

    # Find unmapped PDF fields
    unmapped_fields = pdf_field_names - mapped_pdf_fields

    # Find mapped fields that don't exist in PDF
    invalid_mappings = mapped_pdf_fields - pdf_field_names

    return {
        'total_pdf_fields': len(pdf_field_names),
        'mapped_fields': len(mapped_pdf_fields),
        'unmapped_fields': sorted(list(unmapped_fields)),
        'invalid_mappings': sorted(list(invalid_mappings)),
        'mapping_coverage': len(mapped_pdf_fields) / len(pdf_field_names) * 100
    }

def suggest_mappings(unmapped_fields, field_mappings):
    """Suggest potential mappings for unmapped fields"""

    suggestions = {}

    # Common patterns
    income_buttons = [f for f in unmapped_fields if '25000' in f or '49999' in f or 'Million' in f]
    risk_buttons = [f for f in unmapped_fields if any(x in f.lower() for x in ['low', 'medium', 'high', 'novice', 'fair', 'good', 'sophisticated'])]
    investment_buttons = [f for f in unmapped_fields if any(x in f for x in ['Bonds', 'Stocks', 'Mutual Funds', 'Term Deposits', 'Real Estate']) and f.endswith('_2')]
    province_fields = [f for f in unmapped_fields if f.startswith('Province_')]
    city_fields = [f for f in unmapped_fields if f.startswith('City_') and f != 'City']

    suggestions['income_ranges'] = income_buttons
    suggestions['risk_levels'] = risk_buttons
    suggestions['joint_investments'] = investment_buttons
    suggestions['province_fields'] = province_fields
    suggestions['city_fields'] = city_fields

    # Fields that might need form fields added
    suggestions['missing_form_fields'] = [
        f for f in unmapped_fields
        if any(keyword in f.lower() for keyword in ['signature', 'agent', 'date_', 'joint'])
        and not any(f.endswith(suffix) for suffix in ['_2', '_3'])
    ]

    return suggestions

def main():
    # Load data files
    pdf_fields = load_json_file('src/data/kyc_pdf_fields.json')
    field_mappings = load_json_file('src/data/kyc_field_mappings.json')

    # Analyze mappings
    analysis = analyze_mappings(pdf_fields, field_mappings)

    print("=== PDF FIELD MAPPING ANALYSIS ===")
    print(f"Total PDF fields: {analysis['total_pdf_fields']}")
    print(f"Mapped PDF fields: {analysis['mapped_fields']}")
    print(".1f")
    print()

    if analysis['invalid_mappings']:
        print("=== INVALID MAPPINGS (fields don't exist in PDF) ===")
        for field in analysis['invalid_mappings']:
            print(f"  - {field}")
        print()

    if analysis['unmapped_fields']:
        print("=== UNMAPPED PDF FIELDS ===")
        for field in analysis['unmapped_fields'][:50]:  # Show first 50
            print(f"  - {field}")
        if len(analysis['unmapped_fields']) > 50:
            print(f"  ... and {len(analysis['unmapped_fields']) - 50} more")
        print()

        # Get suggestions
        suggestions = suggest_mappings(analysis['unmapped_fields'], field_mappings)

        print("=== MAPPING SUGGESTIONS ===")

        if suggestions['income_ranges']:
            print("Income range buttons (need radio_group mapping):")
            for field in suggestions['income_ranges']:
                print(f"  - {field}")

        if suggestions['risk_levels']:
            print("Risk level buttons (need radio_group mapping):")
            for field in suggestions['risk_levels']:
                print(f"  - {field}")

        if suggestions['joint_investments']:
            print("Joint investment checkboxes:")
            for field in suggestions['joint_investments']:
                print(f"  - {field}")

        if suggestions['province_fields']:
            print("Additional province fields:")
            for field in suggestions['province_fields']:
                print(f"  - {field}")

        if suggestions['city_fields']:
            print("Additional city fields:")
            for field in suggestions['city_fields']:
                print(f"  - {field}")

        if suggestions['missing_form_fields']:
            print("Fields that might need new form inputs:")
            for field in suggestions['missing_form_fields']:
                print(f"  - {field}")

if __name__ == "__main__":
    main()