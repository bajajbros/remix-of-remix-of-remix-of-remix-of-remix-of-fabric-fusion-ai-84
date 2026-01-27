import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    const fetchAgreement = async () => {
      try {
        const { data, error } = await supabase
          .from('agreements')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('share_token', token)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError('Agreement not found');
          return;
        }

        setAgreement(data as any);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Agreement Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'The agreement you are looking for does not exist or has been removed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agreement</h1>
            <p className="text-muted-foreground">#{agreement.agreement_number}</p>
          </div>
          <Button
            onClick={() => {
              generateAgreementPDF(agreement);
            }}
            className="gap-2"
          >
            <Download size={16} /> Download PDF
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b bg-muted/50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{agreement.title}</h2>
                <p className="text-sm text-muted-foreground">{agreement.type.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  agreement.status === 'signed' ? 'bg-accent/20 text-accent' :
                  agreement.status === 'pending_signature' ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {agreement.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Party Details:</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{agreement.client.company || agreement.client.name}</p>
                  {agreement.client.email && <p>{agreement.client.email}</p>}
                  {agreement.client.phone && <p>{agreement.client.phone}</p>}
                  {agreement.client.address && (
                    <p className="text-muted-foreground">{agreement.client.address}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Agreement Details:</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Start Date:</span> {formatDate(agreement.start_date)}</p>
                  <p><span className="text-muted-foreground">End Date:</span> {formatDate(agreement.end_date)}</p>
                  {agreement.value > 0 && (
                    <p><span className="text-muted-foreground">Value:</span> {formatCurrency(agreement.value)}</p>
                  )}
                  {agreement.signed_date && (
                    <p><span className="text-muted-foreground">Signed On:</span> {formatDate(agreement.signed_date)}</p>
                  )}
                </div>
              </div>
            </div>

            {agreement.terms && agreement.terms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Terms & Conditions:</h3>
                <div className="space-y-2">
                  {agreement.terms.map((term, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="font-semibold text-primary">{index + 1}.</span>
                      <p className="text-sm flex-1">{term}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agreement.signed_date && (
              <div className="bg-accent/10 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="text-accent" size={24} />
                <div>
                  <p className="font-semibold">Agreement Signed</p>
                  <p className="text-sm text-muted-foreground">
                    Signed on {formatDate(agreement.signed_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Signatures:</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Client Representative</p>
                  <p className="text-sm">{agreement.signatory_client || 'Pending'}</p>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground">Signature</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Company Representative</p>
                  <p className="text-sm">{agreement.signatory_company || 'Pending'}</p>
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground">Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {agreement.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{agreement.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>QWII - Optimize Vision</p>
        </div>
      </div>
    </div>
  );
};

export default SharedAgreement;
