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
    city?: string;
    state?: string;
    country?: string;
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
    phone?: string;
    address?: string;
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
    address?: string;
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

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

const addHeader = (doc: jsPDF, title: string, docNumber: string) => {
  const pageWidth = doc.internal.pageSize.width;

  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, 15, pageWidth - 20, 15);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QWII', 20, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Optimize Vision', 20, 31);
  doc.text('Email: contact@qwii.com', 20, 36);
  doc.text('Phone: +91 XXXXXXXXXX', 20, 41);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 20, 25, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(docNumber, pageWidth - 20, 32, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.line(20, 47, pageWidth - 20, 47);
};

const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business', 20, pageHeight - 13);
  doc.text(`Page ${pageNumber}`, pageWidth - 20, pageHeight - 13, { align: 'right' });
  doc.text('QWII - Optimize Vision | Textile Industry Solutions', pageWidth / 2, pageHeight - 8, { align: 'center' });
};

export const generateInvoicePDF = (data: InvoicePDFData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    addHeader(doc, 'TAX INVOICE', `#${data.invoice_number}`);

    let yPos = 57;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, yPos);
    doc.text('INVOICE DETAILS:', 115, yPos);

    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const clientName = data.client.company || data.client.name || 'N/A';
    doc.text(clientName, 20, yPos);
    yPos += 5;

    if (data.client.gst_number) {
      doc.text(`GSTIN: ${data.client.gst_number}`, 20, yPos);
      yPos += 5;
    }

    if (data.client.email) {
      doc.text(data.client.email, 20, yPos);
      yPos += 5;
    }

    if (data.client.phone) {
      doc.text(data.client.phone, 20, yPos);
      yPos += 5;
    }

    const clientAddress = [
      data.client.address,
      data.client.city,
      data.client.state,
      data.client.country
    ].filter(Boolean).join(', ');

    if (clientAddress) {
      const addressLines = doc.splitTextToSize(clientAddress, 85);
      doc.text(addressLines, 20, yPos);
    }

    let detailsY = 63;
    doc.text(`Invoice Number: ${data.invoice_number}`, 115, detailsY);
    detailsY += 5;
    doc.text(`Issue Date: ${formatDate(data.issue_date)}`, 115, detailsY);
    detailsY += 5;
    doc.text(`Due Date: ${formatDate(data.due_date)}`, 115, detailsY);
    detailsY += 5;

    if (data.payment_date) {
      doc.text(`Paid On: ${formatDate(data.payment_date)}`, 115, detailsY);
      detailsY += 5;
    }

    yPos = Math.max(yPos, detailsY) + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ITEM DETAILS', 20, yPos);
    yPos += 5;

    const items = data.items || [];
    if (items.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('No items', 20, yPos);
      yPos += 10;
    } else {
      const tableData = items.map((item, index) => [
        String(index + 1),
        item.description,
        String(item.quantity),
        formatCurrency(item.rate),
        formatCurrency(item.amount),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [128, 128, 128],
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 85 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    const summaryX = pageWidth - 75;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text('Subtotal:', summaryX, yPos);
    doc.text(formatCurrency(data.subtotal), summaryX + 50, yPos, { align: 'right' });
    yPos += 5;

    if (data.cgst > 0) {
      doc.text('CGST:', summaryX, yPos);
      doc.text(formatCurrency(data.cgst), summaryX + 50, yPos, { align: 'right' });
      yPos += 5;

      doc.text('SGST:', summaryX, yPos);
      doc.text(formatCurrency(data.sgst), summaryX + 50, yPos, { align: 'right' });
      yPos += 5;
    }

    if (data.igst > 0) {
      doc.text('IGST:', summaryX, yPos);
      doc.text(formatCurrency(data.igst), summaryX + 50, yPos, { align: 'right' });
      yPos += 5;
    }

    doc.setLineWidth(0.3);
    doc.line(summaryX, yPos, summaryX + 50, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL (₹):', summaryX, yPos);
    doc.text(formatCurrency(data.total), summaryX + 50, yPos, { align: 'right' });
    yPos += 8;

    if (data.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Notes:', 20, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(data.notes, pageWidth - 40);
      doc.text(notesLines, 20, yPos);
    }

    addFooter(doc, 1);

    doc.save(`Invoice-${data.invoice_number}.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
};

export const generateAgreementPDF = (data: AgreementPDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  addHeader(doc, 'AGREEMENT', `#${data.agreement_number}`);

  let yPos = 57;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const titleLines = doc.splitTextToSize(data.title, pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += titleLines.length * 6 + 4;

  doc.setFontSize(9);
  doc.text(`Type: ${data.type.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.text('PARTY DETAILS:', 20, yPos);
  doc.text('AGREEMENT INFO:', 115, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const clientName = data.client.company || data.client.name || 'N/A';
  doc.text(clientName, 20, yPos);

  let infoY = yPos;
  doc.text(`Start Date: ${formatDate(data.start_date)}`, 115, infoY);
  infoY += 5;
  doc.text(`End Date: ${formatDate(data.end_date)}`, 115, infoY);
  infoY += 5;

  if (data.value > 0) {
    doc.text(`Value: ₹${formatCurrency(data.value)}`, 115, infoY);
    infoY += 5;
  }

  if (data.signed_date) {
    doc.text(`Signed On: ${formatDate(data.signed_date)}`, 115, infoY);
    infoY += 5;
  }

  yPos += 5;
  if (data.client.email) {
    doc.text(data.client.email, 20, yPos);
    yPos += 5;
  }

  if (data.client.phone) {
    doc.text(data.client.phone, 20, yPos);
    yPos += 5;
  }

  if (data.client.address) {
    const addressLines = doc.splitTextToSize(data.client.address, 85);
    doc.text(addressLines, 20, yPos);
    yPos += addressLines.length * 5;
  }

  yPos = Math.max(yPos, infoY) + 8;

  if (data.terms && data.terms.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TERMS & CONDITIONS', 20, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    data.terms.forEach((term, index) => {
      if (yPos > 250) {
        addFooter(doc, 1);
        doc.addPage();
        addHeader(doc, 'AGREEMENT', `#${data.agreement_number}`);
        yPos = 57;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, 20, yPos);

      doc.setFont('helvetica', 'normal');
      const termLines = doc.splitTextToSize(term, pageWidth - 50);
      doc.text(termLines, 27, yPos);

      yPos += termLines.length * 5 + 3;
    });

    yPos += 5;
  }

  if (yPos > 220) {
    addFooter(doc, 1);
    doc.addPage();
    addHeader(doc, 'AGREEMENT', `#${data.agreement_number}`);
    yPos = 57;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SIGNATURES', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.text('Client Representative', 20, yPos);
  doc.text('Company Representative', 115, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(data.signatory_client || '_____________________', 20, yPos);
  doc.text(data.signatory_company || '_____________________', 115, yPos);
  yPos += 10;

  doc.text('Signature: _____________________', 20, yPos);
  doc.text('Signature: _____________________', 115, yPos);
  yPos += 8;

  doc.text('Date: _____________________', 20, yPos);
  doc.text('Date: _____________________', 115, yPos);

  if (data.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPos);
  }

  addFooter(doc, 1);

  doc.save(`Agreement-${data.agreement_number}.pdf`);
};

export const generateQuotationPDF = (data: QuotationPDFData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    addHeader(doc, 'QUOTATION', `#${data.quote_number}`);

    let yPos = 57;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTE FOR:', 20, yPos);
    doc.text('QUOTE DETAILS:', 115, yPos);

    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const clientName = data.client.company || data.client.name || 'N/A';
    doc.text(clientName, 20, yPos);
    yPos += 5;

    if (data.client.email) {
      doc.text(data.client.email, 20, yPos);
      yPos += 5;
    }

    if (data.client.phone) {
      doc.text(data.client.phone, 20, yPos);
      yPos += 5;
    }

    if (data.client.address) {
      const addressLines = doc.splitTextToSize(data.client.address, 85);
      doc.text(addressLines, 20, yPos);
    }

    let detailsY = 63;
    doc.text(`Quote Number: ${data.quote_number}`, 115, detailsY);
    detailsY += 5;
    doc.text(`Created On: ${formatDate(data.created_at)}`, 115, detailsY);
    detailsY += 5;
    doc.text(`Valid Until: ${formatDate(data.valid_until)}`, 115, detailsY);
    detailsY += 5;

    yPos = Math.max(yPos, detailsY) + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ITEMS & PRICING', 20, yPos);
    yPos += 5;

    const items = data.items || [];
    if (items.length > 0) {
      const tableData = items.map((item, index) => {
        const productText = item.product + (item.description ? `\n${item.description}` : '');
        return [
          String(index + 1),
          productText,
          String(item.quantity),
          formatCurrency(item.unit_price),
          item.discount ? `${item.discount}%` : '-',
          formatCurrency(item.total),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product', 'Qty', 'Unit Price (₹)', 'Disc', 'Total (₹)']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [128, 128, 128],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    const summaryX = pageWidth - 75;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text('Subtotal:', summaryX, yPos);
    doc.text(formatCurrency(data.subtotal), summaryX + 50, yPos, { align: 'right' });
    yPos += 5;

    if (data.discount > 0) {
      doc.text('Discount:', summaryX, yPos);
      doc.text(`-${formatCurrency(data.discount)}`, summaryX + 50, yPos, { align: 'right' });
      yPos += 5;
    }

    doc.text('Tax:', summaryX, yPos);
    doc.text(formatCurrency(data.tax), summaryX + 50, yPos, { align: 'right' });
    yPos += 5;

    doc.setLineWidth(0.3);
    doc.line(summaryX, yPos, summaryX + 50, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL (₹):', summaryX, yPos);
    doc.text(formatCurrency(data.total), summaryX + 50, yPos, { align: 'right' });
    yPos += 8;

    if (data.terms) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Terms & Conditions:', 20, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(data.terms, pageWidth - 40);
      doc.text(termsLines, 20, yPos);
      yPos += termsLines.length * 5 + 5;
    }

    if (data.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Notes:', 20, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(data.notes, pageWidth - 40);
      doc.text(notesLines, 20, yPos);
    }

    addFooter(doc, 1);

    doc.save(`Quotation-${data.quote_number}.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
};
