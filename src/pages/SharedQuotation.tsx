import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateQuotationPDF } from '@/lib/pdfUtils';
import { formatDate } from '@/lib/exportUtils';
import { Download, FileText } from 'lucide-react';

interface QuotationData {
  quote_number: string;
  created_at: string;
  valid_until: string;
  status: string;
  items: Array<{
    product: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    discount: number | null;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terms: string | null;
  notes: string | null;
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

const SharedQuotation = () => {
  const { token } = useParams<{ token: string }>();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
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
    const fetchQuotation = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-document`;
        const response = await fetch(`${apiUrl}?token=${token}&type=quotation`);

        if (!response.ok) {
          setError('Quotation not found');
          setLoading(false);
          return;
        }

        const quotationData = await response.json();
        setQuotation(quotationData);
      } catch (err) {
        setError('Failed to load quotation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQuotation();
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

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-md w-full rounded-lg shadow-sm p-12 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <FileText size={48} className="mx-auto mb-4" style={{ color: '#9ca3af', opacity: 0.5 }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Quotation Not Found</h2>
          <p style={{ color: '#6b7280' }}>
            {error || 'The quotation you are looking for does not exist or has been removed.'}
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
            <h1 className="text-3xl font-bold text-gray-900">Quotation</h1>
            <p className="text-gray-600">#{quotation.quote_number}</p>
          </div>
          <button
            onClick={() => {
              try {
                generateQuotationPDF(quotation);
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
                  quotation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  quotation.status === 'sent' ? 'bg-yellow-100 text-yellow-700' :
                  quotation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {quotation.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Quote For:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p className="font-medium">{quotation.client.company || quotation.client.name}</p>
                  {quotation.client.email && <p>{quotation.client.email}</p>}
                  {quotation.client.phone && <p>{quotation.client.phone}</p>}
                  {quotation.client.address && (
                    <p className="text-gray-600">{quotation.client.address}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Quote Details:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p><span className="text-gray-600">Created On:</span> {formatDate(quotation.created_at)}</p>
                  <p><span className="text-gray-600">Valid Until:</span> {formatDate(quotation.valid_until)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Items:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-900">#</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-900">Product</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-900">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-900">Unit Price</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-900">Disc</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items && quotation.items.length > 0 && quotation.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="p-3 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{item.product}</p>
                            {item.description && (
                              <p className="text-xs text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-center text-gray-900">{item.quantity}</td>
                        <td className="p-3 text-sm text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-sm text-center text-gray-900">{item.discount ? `${item.discount}%` : '-'}</td>
                        <td className="p-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
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
                  <span className="font-medium text-gray-900">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(quotation.tax)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>

            {quotation.terms && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-gray-900">Terms & Conditions:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{quotation.terms}</p>
              </div>
            )}

            {quotation.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-gray-900">Notes:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{quotation.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Thank you for your interest!</p>
        </div>
      </div>
    </div>
  );
};

export default SharedQuotation;
