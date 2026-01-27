import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: string;
  user_id?: string;
  name?: string;
  company_name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  industry?: string;
  business_type?: string;
  company_size?: string;
  website?: string;
  google_rating?: number;
  google_reviews_count?: number;
  google_place_id?: string;
  ai_insights?: string;
  potential_sticker_needs?: string[];
  estimated_order_value?: number;
  suggested_pitch?: string;
  score?: number;
  confidence_level?: string;
  priority?: string;
  status?: string;
  assigned_to_user_id?: string;
  converted_to_client_id?: string;
  source?: string;
  search_query?: string;
  source_url?: string;
  notes?: string;
  last_contact_date?: string;
  follow_up_date?: string;
  contact_attempts?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LeadGenerationLog {
  id: string;
  run_date: string;
  status: string;
  leads_generated: number;
  search_query?: string;
  target_industry?: string;
  target_location?: string;
  google_maps_calls?: number;
  groq_calls?: number;
  gemini_calls?: number;
  duration_seconds?: number;
  success_rate?: number;
  error_message?: string;
  created_at: string;
}

export interface LeadSource {
  id: string;
  industry_name: string;
  search_keywords: string[];
  target_locations: string[];
  is_active: boolean;
  priority: number;
  day_of_week?: number;
  description?: string;
  total_leads_generated?: number;
  last_used_date?: string;
  created_at: string;
  updated_at: string;
}

export const useLeads = () => {
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: leadGenerationLogs } = useQuery({
    queryKey: ["lead_generation_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_generation_logs")
        .select("*")
        .order("run_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as LeadGenerationLog[];
    },
  });

  const { data: leadSources } = useQuery({
    queryKey: ["lead_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_sources")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as LeadSource[];
    },
  });

  const generateLeadsMutation = useMutation({
    mutationFn: async ({
      targetIndustry,
      targetLocation,
      limit = 7,
    }: {
      targetIndustry?: string;
      targetLocation?: string;
      limit?: number;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheduled-lead-generation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetIndustry,
            targetLocation,
            limit,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate leads");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead_generation_logs"] });
      toast.success(`Successfully generated ${data.leads_generated} leads!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate leads: ${error.message}`);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: lead.name || lead.company_name,
          company: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          country: lead.country || "India",
          notes: `Converted from lead. ${lead.ai_insights || ""}`,
          status: "active",
          type: lead.priority === "hot" ? "premium" : "regular",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          status: "converted",
          converted_to_client_id: clientData.id,
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      return clientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Lead converted to client successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to convert lead: ${error.message}`);
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({
      leadId,
      activityType,
      notes,
      outcome,
    }: {
      leadId: string;
      activityType: string;
      notes?: string;
      outcome?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          lead_id: leadId,
          user_id: user.id,
          activity_type: activityType,
          notes,
          outcome,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          last_contact_date: new Date().toISOString(),
          contact_attempts: supabase.rpc("increment", { x: 1 }),
        })
        .eq("id", leadId);

      if (updateError) console.error("Failed to update contact date:", updateError);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Activity added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add activity: ${error.message}`);
    },
  });

  return {
    leads,
    isLoading,
    leadGenerationLogs,
    leadSources,
    generateLeads: generateLeadsMutation.mutate,
    isGenerating: generateLeadsMutation.isPending,
    updateLead: updateLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    convertToClient: convertToClientMutation.mutate,
    addActivity: addActivityMutation.mutate,
  };
};
