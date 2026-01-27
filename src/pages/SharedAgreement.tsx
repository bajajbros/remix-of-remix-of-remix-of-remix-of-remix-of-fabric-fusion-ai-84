import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateAgreementPDF } from '@/lib/pdfUtils';
import { formatDate } from '@/lib/exportUtils';
import { Download, FileText, CheckCircle } from 'lucide-react';

interface AgreementData {
  agreement_number: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  value: number;
  status: string;
  terms: string[] | null;
  signatory_client: string | null;
  signatory_company: string | null;
  signed_date: string | null;
  notes: string | null;
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

const SharedAgreement = () => {
  const { token } = useParams<{ token: string }>();
  const [agreement, setAgreement] = useState<AgreementData | null>(null);
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
    const fetchAgreement = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-document`;
        const response = await fetch(`${apiUrl}?token=${token}&type=agreement`);

        if (!response.ok) {
          setError('Agreement not found');
          setLoading(false);
          return;
        }

        const agreementData = await response.json();
        setAgreement(agreementData);
      } catch (err) {
        setError('Failed to load agreement');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAgreement();
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

  if (error || !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-md w-full rounded-lg shadow-sm p-12 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <FileText size={48} className="mx-auto mb-4" style={{ color: '#9ca3af', opacity: 0.5 }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Agreement Not Found</h2>
          <p style={{ color: '#6b7280' }}>
            {error || 'The agreement you are looking for does not exist or has been removed.'}
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
            <h1 className="text-3xl font-bold text-gray-900">Agreement</h1>
            <p className="text-gray-600">#{agreement.agreement_number}</p>
          </div>
          <button
            onClick={() => {
              try {
                generateAgreementPDF(agreement);
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
                <h2 className="text-2xl font-bold text-gray-900">{agreement.title}</h2>
                <p className="text-sm text-gray-600">{agreement.type.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  agreement.status === 'signed' ? 'bg-green-100 text-green-700' :
                  agreement.status === 'pending_signature' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {agreement.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Party Details:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p className="font-medium">{agreement.client.company || agreement.client.name}</p>
                  {agreement.client.email && <p>{agreement.client.email}</p>}
                  {agreement.client.phone && <p>{agreement.client.phone}</p>}
                  {agreement.client.address && (
                    <p className="text-gray-600">{agreement.client.address}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Agreement Details:</h3>
                <div className="text-sm space-y-1 text-gray-900">
                  <p><span className="text-gray-600">Start Date:</span> {formatDate(agreement.start_date)}</p>
                  <p><span className="text-gray-600">End Date:</span> {formatDate(agreement.end_date)}</p>
                  {agreement.value > 0 && (
                    <p><span className="text-gray-600">Value:</span> {formatCurrency(agreement.value)}</p>
                  )}
                  {agreement.signed_date && (
                    <p><span className="text-gray-600">Signed On:</span> {formatDate(agreement.signed_date)}</p>
                  )}
                </div>
              </div>
            </div>

            {agreement.terms && agreement.terms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Terms & Conditions:</h3>
                <div className="space-y-2">
                  {agreement.terms.map((term, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-blue-600">{index + 1}.</span>
                      <p className="text-sm flex-1 text-gray-900">{term}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agreement.signed_date && (
              <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Agreement Signed</p>
                  <p className="text-sm text-gray-600">
                    Signed on {formatDate(agreement.signed_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 text-gray-900">Signatures:</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Client Representative</p>
                  <p className="text-sm text-gray-900">{agreement.signatory_client || 'Pending'}</p>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-gray-600">Signature</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Company Representative</p>
                  <p className="text-sm text-gray-900">{agreement.signatory_company || 'Pending'}</p>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-gray-600">Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {agreement.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-gray-900">Notes:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{agreement.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>QWII - Optimize Vision</p>
        </div>
      </div>
    </div>
  );
};

export default SharedAgreement;
