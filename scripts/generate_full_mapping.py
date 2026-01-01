import re
import json
from pathlib import Path

root = Path('')
kyc = (root / 'src' / 'components' / 'KYCForm.jsx').read_text()
pdf_fields = json.loads((root / 'src' / 'data' / 'kyc_pdf_fields.json').read_text())

# Extract register('...') and register("...") occurrences
regs = re.findall(r"register\(\s*'([^']+)'\s*\)|register\(\s*\"([^\"]+)\"\s*\)", kyc)
logical_fields = []
for a,b in regs:
    name = a or b
    if name not in logical_fields:
        logical_fields.append(name)

# Helper normalize
def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())

pdf_names = [f['name'] for f in pdf_fields]
pdf_map = {f['name']: f['type'] for f in pdf_fields}

mapping = {}
for lf in logical_fields:
    best = None
    best_score = 0
    ln = norm(lf)
    for pn in pdf_names:
        pn_norm = norm(pn)
        # score: common substring length
        score = 0
        if ln in pn_norm or pn_norm in ln:
            score = len(ln)
        else:
            # token overlap
            ln_tokens = set(re.findall(r"[a-z0-9]+", ln))
            pn_tokens = set(re.findall(r"[a-z0-9]+", pn_norm))
            score = len(ln_tokens & pn_tokens)
        if score > best_score:
            best_score = score
            best = pn
    # fallback: exact match
    if not best:
        best = lf
    ftype = 'text'
    pdf_type = pdf_map.get(best, '')
    if pdf_type == 'Btn':
        ftype = 'checkbox'
    mapping[lf] = { 'type': ftype, 'pdf_field': best }

# Post-adjust common logical names
renames = {
    'first_name': 'First Name Business Name',
    'last_name': 'Last NameBusiness Name',
    'sin': 'Social Insurance Number',
    'dob': 'Date of Birth',
    'phone_residence': 'Telephone Number Residence',
    'phone_business': 'Telephone Number Business',
    'email': 'Email Address',
    'address': 'Address',
    'city': 'City',
    'province': 'Province',
    'postal_code': 'Postal Code',
    'employer': 'Employer Name',
    'occupation': 'Occupation',
    'net_worth': 'Net Worth',
    'fixed_assets': 'Fixed Assets',
    'liquid_assets': 'Fixed Assets',
    'document number': 'Document Number',
    'document_number': 'Document Number',
    'jurisdiction': 'Jurisdiction',
    'expiry': 'Expiry',
    'bank_name': 'Financial Institution Name',
    'bank_transit': 'Transit Number',
    'bank_institution': 'Institution Number',
    'bank_account': 'Account Number',
}

for k,v in renames.items():
    if k in mapping:
        mapping[k]['pdf_field'] = v
        mapping[k]['type'] = 'text' if pdf_map.get(v,'')=='Tx' else 'checkbox'

# Additional manual tweaks for known fields
manual = {
    'title': { 'type': 'radio_group', 'pdf_field': 'Mr', 'value_map': {'Mr.':'Mr','Mrs.':'Mrs','Miss':'Miss','Ms.':'Ms','Dr.':'Dr','Other':'Other'} },
    'account_type': { 'type': 'radio_group', 'pdf_field': 'Individual Account', 'value_map': {'individual':'Individual Account','joint':'Joint'} },
    'tax_resident_canada': { 'type': 'checkbox', 'pdf_field': 'Tax Resident Canada', 'checked_value': 'On' },
    'tax_resident_us': { 'type': 'checkbox', 'pdf_field': 'Tax Resident US', 'checked_value': 'On' },
    'drivers_license': { 'type': 'checkbox', 'pdf_field': 'Drivers License', 'checked_value': 'On' },
    'passport': { 'type': 'checkbox', 'pdf_field': 'Passport', 'checked_value': 'On' },
    'rrsp': { 'type': 'checkbox', 'pdf_field': 'RRSP', 'checked_value': 'On' },
}
for k,v in manual.items():
    mapping[k] = v

print(json.dumps(mapping, indent=2, ensure_ascii=False))
