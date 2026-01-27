import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateInvoicePDF } from '@/lib/pdfUtils';
import { formatDate } from '@/lib/exportUtils';
import { Download, FileText } from 'lucide-react';

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  payment_date: string | null;
  status: string;
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
  notes: string | null;
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    gst_number: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
}

const SharedInvoice = () => {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#f9fafb';
    document.body.style.color = '#111827';
    document.documentElement.style.backgroundColor = '#f9fafb';

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-document`;
        const response = await fetch(`${apiUrl}?token=${token}&type=invoice`);

        if (!response.ok) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }

        const invoiceData = await response.json();
        setInvoice(invoiceData);
      } catch (err) {
        setError('Failed to load invoice');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-32 w-full rounded" style={{ backgroundColor: '#e5e7eb' }} />
          <div className="h-96 w-full rounded" style={{ backgroundColor: '#e5e7eb' }} />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-md w-full rounded-lg shadow-sm p-12 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <FileText size={48} className="mx-auto mb-4" style={{ color: '#9ca3af', opacity: 0.5 }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Invoice Not Found</h2>
          <p style={{ color: '#6b7280' }}>
            {error || 'The invoice you are looking for does not exist or has been removed.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f9fafb', color: '#111827' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-600">#{invoice.invoice_number}</p>
          </div>
          <button
            onClick={() => {
              try {
                generateInvoicePDF(invoice);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer transition-colors"
            style={{ zIndex: 10 }}
          >
            <Download size={16} /> Download PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b bg-gray-50 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">QWII</h2>
                <p className="text-sm text-gray-600">Optimize Vision</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'sent' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoice.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Bill To:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p className="font-medium">{invoice.client.company || invoice.client.name}</p>
                  {invoice.client.gst_number && <p>GSTIN: {invoice.client.gst_number}</p>}
                  {invoice.client.email && <p>{invoice.client.email}</p>}
                  {invoice.client.phone && <p>{invoice.client.phone}</p>}
                  {invoice.client.address && (
                    <p className="text-gray-600">
                      {[invoice.client.address, invoice.client.city, invoice.client.state, invoice.client.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Invoice Details:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p><span className="text-gray-600">Issue Date:</span> {formatDate(invoice.issue_date)}</p>
                  <p><span className="text-gray-600">Due Date:</span> {formatDate(invoice.due_date)}</p>
                  {invoice.payment_date && (
                    <p><span className="text-gray-600">Paid On:</span> {formatDate(invoice.payment_date)}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Items:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">#</th>
                      <th className="text-left p-3 text-sm font-semibold">Description</th>
                      <th className="text-center p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Rate</th>
                      <th className="text-right p-3 text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items && invoice.items.length > 0 && invoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="p-3 text-sm text-gray-900">{item.description}</td>
                        <td className="p-3 text-sm text-center text-gray-900">{item.quantity}</td>
                        <td className="p-3 text-sm text-right text-gray-900">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.cgst > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium">{formatCurrency(invoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">{formatCurrency(invoice.sgst)}</span>
                    </div>
                  </>
                )}
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.igst)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-gray-900">Notes:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default SharedInvoice;
