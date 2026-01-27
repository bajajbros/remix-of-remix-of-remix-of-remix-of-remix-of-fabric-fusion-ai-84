import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    const fetchQuotation = async () => {
      try {
        const { data, error } = await supabase
          .from('quotations')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('share_token', token)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError('Quotation not found');
          return;
        }

        setQuotation(data as any);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Quotation Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'The quotation you are looking for does not exist or has been removed.'}
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
            <h1 className="text-3xl font-bold">Quotation</h1>
            <p className="text-muted-foreground">#{quotation.quote_number}</p>
          </div>
          <Button
            onClick={() => {
              generateQuotationPDF(quotation);
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
                <h2 className="text-2xl font-bold">QWII</h2>
                <p className="text-sm text-muted-foreground">Optimize Vision</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  quotation.status === 'accepted' ? 'bg-accent/20 text-accent' :
                  quotation.status === 'sent' ? 'bg-warning/20 text-warning' :
                  quotation.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {quotation.status.toUpperCase()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Quote For:</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{quotation.client.company || quotation.client.name}</p>
                  {quotation.client.email && <p>{quotation.client.email}</p>}
                  {quotation.client.phone && <p>{quotation.client.phone}</p>}
                  {quotation.client.address && (
                    <p className="text-muted-foreground">{quotation.client.address}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Quote Details:</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Created On:</span> {formatDate(quotation.created_at)}</p>
                  <p><span className="text-muted-foreground">Valid Until:</span> {formatDate(quotation.valid_until)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Items:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">#</th>
                      <th className="text-left p-3 text-sm font-semibold">Product</th>
                      <th className="text-center p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                      <th className="text-center p-3 text-sm font-semibold">Disc</th>
                      <th className="text-right p-3 text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm">{index + 1}</td>
                        <td className="p-3 text-sm">
                          <div>
                            <p className="font-medium">{item.product}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-center">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-sm text-center">{item.discount ? `${item.discount}%` : '-'}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-sm text-accent">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">{formatCurrency(quotation.tax)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>

            {quotation.terms && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.terms}</p>
              </div>
            )}

            {quotation.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Thank you for your interest!</p>
        </div>
      </div>
    </div>
  );
};

export default SharedQuotation;
