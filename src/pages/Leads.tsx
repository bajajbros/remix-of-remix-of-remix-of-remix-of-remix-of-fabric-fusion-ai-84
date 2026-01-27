import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLeads, Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building2,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  UserPlus,
  RefreshCw,
  Star,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const Leads = () => {
  const {
    leads = [],
    isLoading,
    leadGenerationLogs = [],
    leadSources = [],
    generateLeads,
    isGenerating,
    updateLead,
    convertToClient,
    addActivity,
  } = useLeads();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("auto");

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesPriority = filterPriority === "all" || lead.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    hot: leads.filter((l) => l.priority === "hot").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length) : 0,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "hot":
        return "bg-red-500";
      case "warm":
        return "bg-orange-500";
      case "cold":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityBadgeVariant = (priority?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "hot":
        return "destructive";
      case "warm":
        return "default";
      case "cold":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "new":
        return <Sparkles className="h-4 w-4" />;
      case "contacted":
        return <Phone className="h-4 w-4" />;
      case "qualified":
        return <CheckCircle2 className="h-4 w-4" />;
      case "converted":
        return <UserPlus className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleGenerateLeads = () => {
    generateLeads({
      targetIndustry: selectedIndustry === "all" ? undefined : selectedIndustry,
      targetLocation: selectedLocation === "auto" ? undefined : selectedLocation,
      limit: 7,
    });
  };

  const handleConvertToClient = (lead: Lead) => {
    if (window.confirm(`Convert ${lead.company_name} to client?`)) {
      convertToClient(lead);
    }
  };

  const handleAddNote = () => {
    if (selectedLead && noteText.trim()) {
      addActivity({
        leadId: selectedLead.id,
        activityType: "note",
        notes: noteText,
      });
      setNoteText("");
      setNoteDialogOpen(false);
    }
  };

  const handleCall = (lead: Lead) => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
      addActivity({
        leadId: lead.id,
        activityType: "call",
        notes: "Outbound call made",
      });
    }
  };

  const handleEmail = (lead: Lead) => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
      addActivity({
        leadId: lead.id,
        activityType: "email",
        notes: "Email sent",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lead Generation</h1>
            <p className="text-muted-foreground">
              AI-powered lead generation for your sticker printing business
            </p>
          </div>
          <Button onClick={handleGenerateLeads} disabled={isGenerating} size="lg">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Generating Leads...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Leads
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <Target className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.hot}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.converted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Settings</CardTitle>
            <CardDescription>
              Configure target industry and location for automatic AI-powered lead generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Target Industry</Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.industry_name}>
                        {source.industry_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto Select</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Pune">Pune</SelectItem>
                    <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                    <SelectItem value="Kolkata">Kolkata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleGenerateLeads} disabled={isGenerating} className="w-full">
                  {isGenerating ? "Generating..." : "Generate Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leads Database</CardTitle>
                <CardDescription>Manage and track your generated leads</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, city, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm text-muted-foreground">
                    Generate leads or adjust your filters
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLeads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{lead.company_name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityBadgeVariant(lead.priority)}>
                                {lead.priority?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                {getStatusIcon(lead.status)}
                                {lead.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-sm font-bold">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {lead.score || 0}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          {lead.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.city}, {lead.state}</span>
                            </div>
                          )}
                          {lead.industry && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.industry}</span>
                            </div>
                          )}
                          {lead.estimated_order_value && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>₹{lead.estimated_order_value.toLocaleString()}/mo</span>
                            </div>
                          )}
                        </div>

                        {lead.suggested_pitch && (
                          <div className="rounded-md bg-muted p-3 text-xs">
                            <p className="font-medium mb-1">Suggested Pitch:</p>
                            <p className="text-muted-foreground">{lead.suggested_pitch}</p>
                          </div>
                        )}

                        {lead.potential_sticker_needs && lead.potential_sticker_needs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lead.potential_sticker_needs.slice(0, 3).map((need, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {lead.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCall(lead)}
                              className="flex-1"
                            >
                              <Phone className="mr-1 h-3 w-3" />
                              Call
                            </Button>
                          )}
                          {lead.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEmail(lead)}
                              className="flex-1"
                            >
                              <Mail className="mr-1 h-3 w-3" />
                              Email
                            </Button>
                          )}
                          <Dialog open={noteDialogOpen && selectedLead?.id === lead.id} onOpenChange={setNoteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <MessageSquare className="mr-1 h-3 w-3" />
                                Note
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Note</DialogTitle>
                                <DialogDescription>
                                  Add a note or activity for {lead.company_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Enter your note..."
                                  rows={4}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={handleAddNote} className="flex-1">
                                    Save Note
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setNoteDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {lead.status !== "converted" && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToClient(lead)}
                              className="w-full mt-2"
                            >
                              <UserPlus className="mr-1 h-3 w-3" />
                              Convert to Client
                            </Button>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Added {format(new Date(lead.created_at!), "MMM dd, yyyy")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {leadGenerationLogs && leadGenerationLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>Recent lead generation runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadGenerationLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {log.target_industry || "Mixed Industries"} - {log.target_location || "Multiple Cities"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.run_date), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={log.status === "completed" ? "default" : "destructive"}>
                        {log.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{log.leads_generated}</p>
                        <p className="text-xs text-muted-foreground">leads</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leads;
