import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  gst_number: string | null;
  pan_number: string | null;
  status: 'active' | 'inactive' | 'pending';
  type: 'regular' | 'premium' | 'vip';
  credit_limit: number;
  outstanding_amount: number;
  total_orders: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gst_number?: string;
  pan_number?: string;
  status?: 'active' | 'inactive' | 'pending';
  type?: 'regular' | 'premium' | 'vip';
  credit_limit?: number;
  notes?: string;
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data as Client[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message);
      toast({
        title: "Error loading clients",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (input: CreateClientInput): Promise<Client | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to add clients",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...input,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [data as Client, ...prev]);
      toast({
        title: "Client added",
        description: `${input.name} has been added successfully`
      });
      return data as Client;
    } catch (err: any) {
      console.error('Error creating client:', err);
      toast({
        title: "Error adding client",
        description: err.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateClient = async (id: string, updates: Partial<CreateClientInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ));
      toast({
        title: "Client updated",
        description: "Client information has been updated"
      });
      return true;
    } catch (err: any) {
      console.error('Error updating client:', err);
      toast({
        title: "Error updating client",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Client deleted",
        description: "Client has been removed"
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting client:', err);
      toast({
        title: "Error deleting client",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const getClientById = (id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  // Stats calculations
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    pending: clients.filter(c => c.status === 'pending').length,
    totalOutstanding: clients.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0),
    totalOrders: clients.reduce((sum, c) => sum + (c.total_orders || 0), 0),
    premium: clients.filter(c => c.type === 'premium' || c.type === 'vip').length
  };

  return {
    clients,
    loading,
    error,
    stats,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById
  };
}
