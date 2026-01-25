import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  order_id: string | null;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    gst_number: string | null;
  };
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CreateInvoiceInput {
  client_id: string;
  order_id?: string;
  issue_date?: string;
  due_date?: string;
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
  notes?: string;
  items: CreateInvoiceItemInput[];
}

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, company, email, gst_number),
          items:invoice_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data as Invoice[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
      toast({ title: "Error loading invoices", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice | null> => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please login to create invoices", variant: "destructive" });
      return null;
    }

    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: input.client_id,
          order_id: input.order_id,
          invoice_number: '',
          issue_date: input.issue_date || new Date().toISOString().split('T')[0],
          due_date: input.due_date,
          subtotal: input.subtotal,
          cgst: input.cgst || 0,
          sgst: input.sgst || 0,
          igst: input.igst || 0,
          total: input.total,
          notes: input.notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (input.items && input.items.length > 0) {
        const itemsWithInvoiceId = input.items.map(item => ({
          ...item,
          invoice_id: invoiceData.id
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId);

        if (itemsError) throw itemsError;
      }

      await fetchInvoices();
      toast({ title: "Invoice created", description: `Invoice ${invoiceData.invoice_number} has been created` });
      return invoiceData as Invoice;
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast({ title: "Error creating invoice", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']): Promise<boolean> => {
    try {
      const updates: any = { status };
      if (status === 'paid') {
        updates.payment_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, ...updates, updated_at: new Date().toISOString() } : inv
      ));
      toast({ title: "Invoice updated", description: `Status changed to ${status}` });
      return true;
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      toast({ title: "Error updating invoice", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast({ title: "Invoice deleted", description: "Invoice has been removed" });
      return true;
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      toast({ title: "Error deleting invoice", description: err.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0),
    pendingAmount: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + (i.total || 0), 0),
  };

  return {
    invoices,
    loading,
    error,
    stats,
    fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
  };
}
