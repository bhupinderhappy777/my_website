#!/usr/bin/env python3
import sys
import io
import urllib.request

try:
    from pypdf import PdfReader
except Exception:
    print('pypdf not installed. Please run: pip install pypdf')
    sys.exit(1)

URL_DEFAULT = 'https://aoeymydzugmtjpzsmbbh.supabase.co/storage/v1/object/public/forms/EN%20KYC%203057.pdf'

def fetch_pdf_bytes(url):
    with urllib.request.urlopen(url) as r:
        return r.read()


def list_fields_from_reader(reader):
    fields = reader.get_fields()
    result = {}
    if fields:
        for name, info in fields.items():
            result[name] = info
    else:
        # fallback: inspect annotations on pages
        for i, page in enumerate(reader.pages):
            annots = page.get('/Annots')
            if not annots:
                continue
            for a in annots:
                obj = a.get_object()
                t = obj.get('/T')
                ft = obj.get('/FT')
                if t:
                    name = t
                    result.setdefault(name, {})
                    result[name]['/FT'] = ft
                    result[name]['page'] = i+1
    return result


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else URL_DEFAULT
    print(f'Downloading: {url}')
    data = fetch_pdf_bytes(url)
    reader = PdfReader(io.BytesIO(data))
    fields = list_fields_from_reader(reader)
    if not fields:
        print('No form fields found.')
        return
    print(f'Found {len(fields)} fields:')
    for i, (name, info) in enumerate(fields.items(), 1):
        ft = info.get('/FT') if isinstance(info, dict) else None
        print(f'{i:03d}. {name}  type={ft} info={info}')

if __name__ == '__main__':
    main()
