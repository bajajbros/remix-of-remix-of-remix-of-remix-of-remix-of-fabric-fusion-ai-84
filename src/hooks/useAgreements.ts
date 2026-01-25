import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Agreement {
  id: string;
  user_id: string;
  client_id: string;
  agreement_number: string;
  title: string;
  type: 'nda' | 'sales' | 'service' | 'partnership' | 'supply';
  status: 'draft' | 'pending_signature' | 'signed' | 'expired' | 'terminated';
  start_date: string;
  end_date: string;
  value: number;
  terms: string[] | null;
  signatory_client: string | null;
  signatory_company: string | null;
  signed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
}

export interface CreateAgreementInput {
  client_id: string;
  title: string;
  type?: 'nda' | 'sales' | 'service' | 'partnership' | 'supply';
  start_date?: string;
  end_date: string;
  value?: number;
  terms?: string[];
  signatory_client?: string;
  signatory_company?: string;
  notes?: string;
}

export function useAgreements() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = async () => {
    if (!user) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agreements')
        .select(`
          *,
          client:clients(id, name, company, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements(data as Agreement[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching agreements:', err);
      setError(err.message);
      toast({ title: "Error loading agreements", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createAgreement = async (input: CreateAgreementInput): Promise<Agreement | null> => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please login to create agreements", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('agreements')
        .insert({
          user_id: user.id,
          client_id: input.client_id,
          agreement_number: '',
          title: input.title,
          type: input.type || 'sales',
          start_date: input.start_date || new Date().toISOString().split('T')[0],
          end_date: input.end_date,
          value: input.value || 0,
          terms: input.terms,
          signatory_client: input.signatory_client,
          signatory_company: input.signatory_company,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAgreements();
      toast({ title: "Agreement created", description: `Agreement ${data.agreement_number} has been created` });
      return data as Agreement;
    } catch (err: any) {
      console.error('Error creating agreement:', err);
      toast({ title: "Error creating agreement", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateAgreementStatus = async (id: string, status: Agreement['status']): Promise<boolean> => {
    try {
      const updates: any = { status };
      if (status === 'signed') {
        updates.signed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('agreements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setAgreements(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
      ));
      toast({ title: "Agreement updated", description: `Status changed to ${status.replace('_', ' ')}` });
      return true;
    } catch (err: any) {
      console.error('Error updating agreement:', err);
      toast({ title: "Error updating agreement", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteAgreement = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAgreements(prev => prev.filter(a => a.id !== id));
      toast({ title: "Agreement deleted", description: "Agreement has been removed" });
      return true;
    } catch (err: any) {
      console.error('Error deleting agreement:', err);
      toast({ title: "Error deleting agreement", description: err.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [user]);

  const stats = {
    total: agreements.length,
    draft: agreements.filter(a => a.status === 'draft').length,
    pending: agreements.filter(a => a.status === 'pending_signature').length,
    signed: agreements.filter(a => a.status === 'signed').length,
    expired: agreements.filter(a => a.status === 'expired').length,
    totalValue: agreements.filter(a => a.status === 'signed').reduce((sum, a) => sum + (a.value || 0), 0),
  };

  return {
    agreements,
    loading,
    error,
    stats,
    fetchAgreements,
    createAgreement,
    updateAgreementStatus,
    deleteAgreement,
  };
}
