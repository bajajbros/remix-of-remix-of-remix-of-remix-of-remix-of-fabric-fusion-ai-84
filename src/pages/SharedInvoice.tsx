import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('share_token', token)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError('Invoice not found');
          return;
        }

        setInvoice(data as any);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'The invoice you are looking for does not exist or has been removed.'}
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
            <h1 className="text-3xl font-bold">Invoice</h1>
            <p className="text-muted-foreground">#{invoice.invoice_number}</p>
          </div>
          <Button
            onClick={() => {
              generateInvoicePDF(invoice);
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
                  invoice.status === 'paid' ? 'bg-accent/20 text-accent' :
                  invoice.status === 'sent' ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {invoice.status.toUpperCase()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{invoice.client.company || invoice.client.name}</p>
                  {invoice.client.gst_number && <p>GSTIN: {invoice.client.gst_number}</p>}
                  {invoice.client.email && <p>{invoice.client.email}</p>}
                  {invoice.client.phone && <p>{invoice.client.phone}</p>}
                  {invoice.client.address && (
                    <p className="text-muted-foreground">
                      {[invoice.client.address, invoice.client.city, invoice.client.state, invoice.client.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Invoice Details:</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Issue Date:</span> {formatDate(invoice.issue_date)}</p>
                  <p><span className="text-muted-foreground">Due Date:</span> {formatDate(invoice.due_date)}</p>
                  {invoice.payment_date && (
                    <p><span className="text-muted-foreground">Paid On:</span> {formatDate(invoice.payment_date)}</p>
                  )}
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
                      <th className="text-left p-3 text-sm font-semibold">Description</th>
                      <th className="text-center p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Rate</th>
                      <th className="text-right p-3 text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm">{index + 1}</td>
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-sm text-center">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
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
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.cgst > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST:</span>
                      <span className="font-medium">{formatCurrency(invoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST:</span>
                      <span className="font-medium">{formatCurrency(invoice.sgst)}</span>
                    </div>
                  </>
                )}
                {invoice.igst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST:</span>
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
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default SharedInvoice;
