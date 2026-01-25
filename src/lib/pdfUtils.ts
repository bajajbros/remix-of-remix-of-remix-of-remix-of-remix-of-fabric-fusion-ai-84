import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './exportUtils';

interface InvoicePDFData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client: {
    name?: string;
    company?: string;
    gst_number?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  notes?: string;
  payment_date?: string;
}

interface AgreementPDFData {
  agreement_number: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  value: number;
  client: {
    name?: string;
    company?: string;
    email?: string;
  };
  terms?: string[];
  signatory_client?: string;
  signatory_company?: string;
  signed_date?: string;
  notes?: string;
}

interface QuotationPDFData {
  quote_number: string;
  created_at: string;
  valid_until: string;
  client: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    product: string;
    description?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terms?: string;
  notes?: string;
}

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(16, 24, 40);
  doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('QWII', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OPTIMIZE VISION', 20, 35);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const pageWidth = doc.internal.pageSize.width;
  doc.text(title, pageWidth - 20, 30, { align: 'right' });

  doc.setTextColor(0, 0, 0);
};

const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN')} | Page ${pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
};

export const generateInvoicePDF = (data: InvoicePDFData) => {
  const doc = new jsPDF();

  addHeader(doc, 'TAX INVOICE');

  let yPos = 60;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice: ${data.invoice_number}`, 20, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos);
  doc.text('Invoice Details:', 120, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(data.client.company || data.client.name || 'N/A', 20, yPos);
  doc.text(`Issue Date: ${formatDate(data.issue_date)}`, 120, yPos);
  yPos += 6;

  if (data.client.gst_number) {
    doc.text(`GSTIN: ${data.client.gst_number}`, 20, yPos);
  }
  doc.text(`Due Date: ${formatDate(data.due_date)}`, 120, yPos);
  yPos += 6;

  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`, 20, yPos);
    yPos += 6;
  }

  if (data.client.phone) {
    doc.text(`Phone: ${data.client.phone}`, 20, yPos);
    yPos += 6;
  }

  yPos += 5;

  const tableData = data.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    `₹${item.rate.toLocaleString('en-IN')}`,
    `₹${item.amount.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = 130;
  doc.setFontSize(10);

  doc.text('Subtotal:', summaryX, yPos);
  doc.text(`₹${data.subtotal.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
  yPos += 7;

  if (data.cgst > 0) {
    doc.text('CGST:', summaryX, yPos);
    doc.text(`₹${data.cgst.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
    yPos += 7;

    doc.text('SGST:', summaryX, yPos);
    doc.text(`₹${data.sgst.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
    yPos += 7;
  }

  if (data.igst > 0) {
    doc.text('IGST:', summaryX, yPos);
    doc.text(`₹${data.igst.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.setLineWidth(0.5);
  doc.line(summaryX, yPos, 185, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, yPos);
  doc.text(`₹${data.total.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
  yPos += 10;

  if (data.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', 20, yPos);
    yPos += 6;
    const notesLines = doc.splitTextToSize(data.notes, 170);
    doc.text(notesLines, 20, yPos);
  }

  addFooter(doc, 1);

  doc.save(`Invoice-${data.invoice_number}.pdf`);
};

export const generateAgreementPDF = (data: AgreementPDFData) => {
  const doc = new jsPDF();

  addHeader(doc, 'AGREEMENT');

  let yPos = 60;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.title, 170);
  doc.text(titleLines, 20, yPos);
  yPos += titleLines.length * 8 + 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agreement No: ${data.agreement_number}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Agreement Details', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');

  const details = [
    ['Type:', data.type.toUpperCase()],
    ['Client:', data.client.company || data.client.name || 'N/A'],
    ['Start Date:', formatDate(data.start_date)],
    ['End Date:', formatDate(data.end_date)],
    ['Value:', data.value > 0 ? `₹${data.value.toLocaleString('en-IN')}` : 'N/A'],
  ];

  if (data.signed_date) {
    details.push(['Signed On:', formatDate(data.signed_date)]);
  }

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, yPos);
    yPos += 7;
  });

  yPos += 5;

  if (data.terms && data.terms.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    data.terms.forEach((term, index) => {
      if (yPos > 270) {
        doc.addPage();
        addHeader(doc, 'AGREEMENT');
        yPos = 60;
      }

      const termText = `${index + 1}. ${term}`;
      const termLines = doc.splitTextToSize(termText, 170);
      doc.text(termLines, 20, yPos);
      yPos += termLines.length * 6 + 3;
    });

    yPos += 5;
  }

  if (yPos > 240) {
    doc.addPage();
    addHeader(doc, 'AGREEMENT');
    yPos = 60;
  }

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Signatories', 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Client Representative:', 20, yPos);
  doc.text('Company Representative:', 110, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text(data.signatory_client || '___________________', 20, yPos);
  doc.text(data.signatory_company || '___________________', 110, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Signature: ___________________', 20, yPos);
  doc.text('Signature: ___________________', 110, yPos);
  yPos += 7;
  doc.text('Date: ___________________', 20, yPos);
  doc.text('Date: ___________________', 110, yPos);

  addFooter(doc, 1);

  doc.save(`Agreement-${data.agreement_number}.pdf`);
};

export const generateQuotationPDF = (data: QuotationPDFData) => {
  const doc = new jsPDF();

  addHeader(doc, 'QUOTATION');

  let yPos = 60;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Quote: ${data.quote_number}`, 20, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote For:', 20, yPos);
  doc.text('Quote Details:', 120, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(data.client.company || data.client.name || 'N/A', 20, yPos);
  doc.text(`Created: ${formatDate(data.created_at)}`, 120, yPos);
  yPos += 6;

  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`, 20, yPos);
  }
  doc.text(`Valid Until: ${formatDate(data.valid_until)}`, 120, yPos);
  yPos += 6;

  if (data.client.phone) {
    doc.text(`Phone: ${data.client.phone}`, 20, yPos);
    yPos += 6;
  }

  yPos += 5;

  const tableData = data.items.map((item, index) => [
    index + 1,
    item.product + (item.description ? `\n${item.description}` : ''),
    item.quantity,
    `₹${item.unit_price.toLocaleString('en-IN')}`,
    item.discount ? `${item.discount}%` : '-',
    `₹${item.total.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Product', 'Qty', 'Unit Price', 'Disc', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = 130;
  doc.setFontSize(10);

  doc.text('Subtotal:', summaryX, yPos);
  doc.text(`₹${data.subtotal.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
  yPos += 7;

  if (data.discount > 0) {
    doc.setTextColor(34, 197, 94);
    doc.text('Discount:', summaryX, yPos);
    doc.text(`-₹${data.discount.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 7;
  }

  doc.text('Tax:', summaryX, yPos);
  doc.text(`₹${data.tax.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
  yPos += 7;

  doc.setLineWidth(0.5);
  doc.line(summaryX, yPos, 185, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, yPos);
  doc.text(`₹${data.total.toLocaleString('en-IN')}`, 185, yPos, { align: 'right' });
  yPos += 10;

  if (data.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Terms & Conditions:', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(data.terms, 170);
    doc.text(termsLines, 20, yPos);
    yPos += termsLines.length * 5;
  }

  if (data.notes) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Notes:', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, 170);
    doc.text(notesLines, 20, yPos);
  }

  addFooter(doc, 1);

  doc.save(`Quotation-${data.quote_number}.pdf`);
};
