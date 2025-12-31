import { PDFDocument } from 'pdf-lib';

export async function fillPDF(templateUrl, formData) {
  const existingPdfBytes = await fetch(templateUrl).then((r) => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  Object.entries(formData).forEach(([key, value]) => {
    try {
      const field = form.getTextField(key);
      field.setText(String(value || ''));
    } catch {
      console.log(`Field ${key} not found in PDF template`);
    }
  });

  pdfDoc.flatten();
  return await pdfDoc.save();
}

export function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
