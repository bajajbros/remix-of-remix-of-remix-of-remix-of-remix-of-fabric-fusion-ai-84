import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAgreements, Agreement } from '@/hooks/useAgreements';
import { useClients } from '@/hooks/useClients';
import { exportToCSV, formatDate } from '@/lib/exportUtils';
import { generateAgreementPDF } from '@/lib/pdfUtils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  PenTool,
  Calendar as CalendarIcon,
  Shield,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

const typeConfig = {
  nda: { label: 'NDA', color: 'bg-purple-500/20 text-purple-400' },
  sales: { label: 'Sales', color: 'bg-primary/20 text-primary' },
  service: { label: 'Service', color: 'bg-accent/20 text-accent' },
  partnership: { label: 'Partnership', color: 'bg-secondary/20 text-secondary' },
  supply: { label: 'Supply', color: 'bg-warning/20 text-warning' },
};

const statusConfig = {
  draft: { color: 'bg-muted text-muted-foreground', icon: Edit, label: 'Draft' },
  pending_signature: { color: 'bg-warning/20 text-warning', icon: PenTool, label: 'Pending Signature' },
  signed: { color: 'bg-accent/20 text-accent', icon: CheckCircle, label: 'Signed' },
  expired: { color: 'bg-destructive/20 text-destructive', icon: AlertCircle, label: 'Expired' },
  terminated: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Terminated' },
};

const Agreements = () => {
  const { agreements, loading, stats, createAgreement, updateAgreementStatus, deleteAgreement, fetchAgreements } = useAgreements();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newAgreement, setNewAgreement] = useState({
    client_id: '',
    title: '',
    type: 'sales' as Agreement['type'],
    value: 0,
    terms: '',
    signatory_client: '',
    signatory_company: '',
    notes: '',
  });
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  const filteredAgreements = agreements.filter(agreement => {
    const matchesSearch = 
      agreement.agreement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agreement.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesType = typeFilter === 'all' || agreement.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateAgreement = async () => {
    if (!newAgreement.client_id || !newAgreement.title || !endDate) return;
    setIsSaving(true);
    
    const termsArray = newAgreement.terms.split('\n').filter(t => t.trim());
    
    const result = await createAgreement({
      client_id: newAgreement.client_id,
      title: newAgreement.title,
      type: newAgreement.type,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      end_date: format(endDate, 'yyyy-MM-dd'),
      value: newAgreement.value,
      terms: termsArray.length > 0 ? termsArray : undefined,
      signatory_client: newAgreement.signatory_client || undefined,
      signatory_company: newAgreement.signatory_company || undefined,
      notes: newAgreement.notes || undefined,
    });

    setIsSaving(false);
    if (result) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewAgreement({
      client_id: '',
      title: '',
      type: 'sales',
      value: 0,
      terms: '',
      signatory_client: '',
      signatory_company: '',
      notes: '',
    });
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  };

  const handleExport = (type: 'all' | 'active' | 'pending') => {
    let dataToExport = filteredAgreements;
    let filename = 'agreements';
    
    if (type === 'active') {
      dataToExport = filteredAgreements.filter(a => a.status === 'signed');
      filename = 'active-agreements';
    } else if (type === 'pending') {
      dataToExport = filteredAgreements.filter(a => a.status === 'draft' || a.status === 'pending_signature');
      filename = 'pending-agreements';
    }

    if (dataToExport.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    exportToCSV(
      dataToExport,
      [
        { header: 'Agreement Number', accessor: 'agreement_number' },
        { header: 'Title', accessor: 'title' },
        { header: 'Client', accessor: (a: Agreement) => a.client?.company || a.client?.name || 'Unknown' },
        { header: 'Type', accessor: 'type' },
        { header: 'Start Date', accessor: (a: Agreement) => formatDate(a.start_date) },
        { header: 'End Date', accessor: (a: Agreement) => formatDate(a.end_date) },
        { header: 'Value', accessor: 'value' },
        { header: 'Status', accessor: 'status' },
        { header: 'Signed Date', accessor: (a: Agreement) => formatDate(a.signed_date) },
      ],
      `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    );
    toast({ title: "Export successful", description: `${dataToExport.length} agreements exported` });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide">
              <span className="gradient-text">AGREEMENTS & T&C</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client agreements, contracts, and terms
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <FileSpreadsheet size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('all')}>Export All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('active')}>Export Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pending')}>Export Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={fetchAgreements} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={14} />
                  New Agreement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Agreement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Agreement Title *</Label>
                    <Input 
                      placeholder="e.g., Annual Supply Agreement"
                      value={newAgreement.title}
                      onChange={(e) => setNewAgreement({ ...newAgreement, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={newAgreement.client_id} onValueChange={(v) => setNewAgreement({ ...newAgreement, client_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.company || client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Agreement Type</Label>
                      <Select value={newAgreement.type} onValueChange={(v: Agreement['type']) => setNewAgreement({ ...newAgreement, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                          <SelectItem value="sales">Sales Agreement</SelectItem>
                          <SelectItem value="service">Service Agreement</SelectItem>
                          <SelectItem value="partnership">Partnership Agreement</SelectItem>
                          <SelectItem value="supply">Supply Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Agreement Value (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="0 for NDA"
                      value={newAgreement.value || ''}
                      onChange={(e) => setNewAgreement({ ...newAgreement, value: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea 
                      placeholder="Enter key terms, one per line..."
                      value={newAgreement.terms}
                      onChange={(e) => setNewAgreement({ ...newAgreement, terms: e.target.value })}
                      rows={5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client Signatory</Label>
                      <Input 
                        placeholder="Name of client representative"
                        value={newAgreement.signatory_client}
                        onChange={(e) => setNewAgreement({ ...newAgreement, signatory_client: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Signatory</Label>
                      <Input 
                        placeholder="Name of company representative"
                        value={newAgreement.signatory_company}
                        onChange={(e) => setNewAgreement({ ...newAgreement, signatory_company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Internal notes..."
                      value={newAgreement.notes}
                      onChange={(e) => setNewAgreement({ ...newAgreement, notes: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateAgreement} 
                    className="w-full" 
                    disabled={isSaving || !newAgreement.client_id || !newAgreement.title || !endDate}
                  >
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Agreement'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Agreements</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.signed}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <PenTool size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Signature</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Shield size={16} className="text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Contract Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agreements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="nda">NDA</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="supply">Supply</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_signature">Pending</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agreements Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAgreements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agreements found</p>
              <p className="text-sm">Create your first agreement to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgreements.map((agreement) => {
                  const StatusIcon = statusConfig[agreement.status]?.icon || Edit;
                  return (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-mono font-medium">{agreement.agreement_number}</TableCell>
                      <TableCell>{agreement.title}</TableCell>
                      <TableCell>{agreement.client?.company || agreement.client?.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[agreement.type]?.color || ''}`}>
                          {typeConfig[agreement.type]?.label || agreement.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(agreement.start_date)}</p>
                          <p className="text-muted-foreground">to {formatDate(agreement.end_date)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agreement.value > 0 ? formatCurrency(agreement.value) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[agreement.status]?.color || ''}`}>
                          <StatusIcon size={12} />
                          {statusConfig[agreement.status]?.label || agreement.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedAgreement(agreement); setIsViewDialogOpen(true); }}>
                            <Eye size={14} />
                          </Button>
                          {agreement.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => updateAgreementStatus(agreement.id, 'pending_signature')}>
                              <Send size={14} />
                            </Button>
                          )}
                          {agreement.status === 'pending_signature' && (
                            <Button variant="ghost" size="sm" onClick={() => updateAgreementStatus(agreement.id, 'signed')}>
                              <CheckCircle size={14} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteAgreement(agreement.id)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* View Agreement Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agreement Details</DialogTitle>
            </DialogHeader>
            {selectedAgreement && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{selectedAgreement.title}</h3>
                    <p className="font-mono text-sm text-muted-foreground">{selectedAgreement.agreement_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[selectedAgreement.type]?.color || ''}`}>
                      {typeConfig[selectedAgreement.type]?.label || selectedAgreement.type}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedAgreement.status]?.color || ''}`}>
                      {statusConfig[selectedAgreement.status]?.label || selectedAgreement.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedAgreement.client?.company || selectedAgreement.client?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contract Value</p>
                    <p className="font-medium">{selectedAgreement.value > 0 ? formatCurrency(selectedAgreement.value) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(selectedAgreement.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(selectedAgreement.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Client Signatory</p>
                    <p className="font-medium">{selectedAgreement.signatory_client || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Company Signatory</p>
                    <p className="font-medium">{selectedAgreement.signatory_company || 'Pending'}</p>
                  </div>
                </div>

                {selectedAgreement.terms && selectedAgreement.terms.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Terms & Conditions</p>
                    <ul className="space-y-1">
                      {selectedAgreement.terms.map((term, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAgreement.signed_date && (
                  <div className="bg-accent/10 p-4 rounded-lg flex items-center gap-3">
                    <CheckCircle className="text-accent" size={20} />
                    <div>
                      <p className="font-medium">Agreement Signed</p>
                      <p className="text-sm text-muted-foreground">Signed on {formatDate(selectedAgreement.signed_date)}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      if (selectedAgreement) {
                        generateAgreementPDF({
                          agreement_number: selectedAgreement.agreement_number,
                          title: selectedAgreement.title,
                          type: selectedAgreement.type,
                          start_date: selectedAgreement.start_date,
                          end_date: selectedAgreement.end_date,
                          value: selectedAgreement.value,
                          client: selectedAgreement.client || {},
                          terms: selectedAgreement.terms || undefined,
                          signatory_client: selectedAgreement.signatory_client || undefined,
                          signatory_company: selectedAgreement.signatory_company || undefined,
                          signed_date: selectedAgreement.signed_date || undefined,
                          notes: selectedAgreement.notes || undefined,
                        });
                        toast({ title: 'PDF Downloaded', description: 'Agreement PDF has been generated successfully' });
                      }
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                  {selectedAgreement.status === 'draft' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateAgreementStatus(selectedAgreement.id, 'pending_signature'); setIsViewDialogOpen(false); }}>
                      <Send size={14} /> Send for Signature
                    </Button>
                  )}
                  {selectedAgreement.status === 'pending_signature' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateAgreementStatus(selectedAgreement.id, 'signed'); setIsViewDialogOpen(false); }}>
                      <CheckCircle size={14} /> Mark as Signed
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Agreements;
