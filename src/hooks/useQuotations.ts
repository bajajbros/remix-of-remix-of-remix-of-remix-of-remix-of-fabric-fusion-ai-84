import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface Quotation {
  id: string;
  user_id: string;
  client_id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
}

export interface CreateQuotationItemInput {
  product: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
}

export interface CreateQuotationInput {
  client_id: string;
  valid_until?: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  terms?: string;
  notes?: string;
  items: CreateQuotationItemInput[];
}

export function useQuotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = async () => {
    if (!user) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          client:clients(id, name, company, email),
          items:quotation_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data as Quotation[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.message);
      toast({ title: "Error loading quotations", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createQuotation = async (input: CreateQuotationInput): Promise<Quotation | null> => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please login to create quotations", variant: "destructive" });
      return null;
    }

    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotations')
        .insert({
          user_id: user.id,
          client_id: input.client_id,
          quote_number: '',
          valid_until: input.valid_until,
          subtotal: input.subtotal,
          tax: input.tax || 0,
          discount: input.discount || 0,
          total: input.total,
          terms: input.terms,
          notes: input.notes,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      if (input.items && input.items.length > 0) {
        const itemsWithQuotationId = input.items.map(item => ({
          ...item,
          quotation_id: quoteData.id
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsWithQuotationId);

        if (itemsError) throw itemsError;
      }

      await fetchQuotations();
      toast({ title: "Quotation created", description: `Quotation ${quoteData.quote_number} has been created` });
      return quoteData as Quotation;
    } catch (err: any) {
      console.error('Error creating quotation:', err);
      toast({ title: "Error creating quotation", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateQuotationStatus = async (id: string, status: Quotation['status']): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setQuotations(prev => prev.map(q => 
        q.id === id ? { ...q, status, updated_at: new Date().toISOString() } : q
      ));
      toast({ title: "Quotation updated", description: `Status changed to ${status}` });
      return true;
    } catch (err: any) {
      console.error('Error updating quotation:', err);
      toast({ title: "Error updating quotation", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuotations(prev => prev.filter(q => q.id !== id));
      toast({ title: "Quotation deleted", description: "Quotation has been removed" });
      return true;
    } catch (err: any) {
      console.error('Error deleting quotation:', err);
      toast({ title: "Error deleting quotation", description: err.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [user]);

  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    rejected: quotations.filter(q => q.status === 'rejected').length,
    totalValue: quotations.reduce((sum, q) => sum + (q.total || 0), 0),
    acceptedValue: quotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total || 0), 0),
    conversionRate: quotations.length > 0 ? (quotations.filter(q => q.status === 'accepted').length / quotations.length) * 100 : 0,
  };

  return {
    quotations,
    loading,
    error,
    stats,
    fetchQuotations,
    createQuotation,
    updateQuotationStatus,
    deleteQuotation,
  };
}
