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
import { useQuotations, Quotation, CreateQuotationItemInput } from '@/hooks/useQuotations';
import { useClients } from '@/hooks/useClients';
import { exportToCSV, formatDate, GST_RATES, GSTRate, calculateGST } from '@/lib/exportUtils';
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
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  IndianRupee,
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

const statusConfig = {
  draft: { color: 'bg-muted text-muted-foreground', icon: FileText, label: 'Draft' },
  sent: { color: 'bg-primary/20 text-primary', icon: Send, label: 'Sent' },
  accepted: { color: 'bg-accent/20 text-accent', icon: CheckCircle, label: 'Accepted' },
  rejected: { color: 'bg-destructive/20 text-destructive', icon: XCircle, label: 'Rejected' },
  expired: { color: 'bg-warning/20 text-warning', icon: Clock, label: 'Expired' },
};

const Quotations = () => {
  const { quotations, loading, stats, createQuotation, updateQuotationStatus, deleteQuotation, fetchQuotations } = useQuotations();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newQuote, setNewQuote] = useState({
    client_id: '',
    terms: '',
    notes: '',
  });
  const [validUntil, setValidUntil] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [gstRate, setGstRate] = useState<GSTRate>(18);
  const [quoteItems, setQuoteItems] = useState<CreateQuotationItemInput[]>([]);
  const [currentItem, setCurrentItem] = useState({ product: '', description: '', quantity: 1, unit_price: 0, discount: 0 });

  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    if (!currentItem.product || currentItem.quantity <= 0 || currentItem.unit_price <= 0) return;
    const discountAmount = (currentItem.quantity * currentItem.unit_price * currentItem.discount) / 100;
    const total = (currentItem.quantity * currentItem.unit_price) - discountAmount;
    const newItem: CreateQuotationItemInput = {
      ...currentItem,
      total,
    };
    setQuoteItems([...quoteItems, newItem]);
    setCurrentItem({ product: '', description: '', quantity: 1, unit_price: 0, discount: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const { tax, total } = calculateGST(subtotal, gstRate);
    const totalDiscount = quoteItems.reduce((sum, item) => {
      const discountAmount = (item.quantity * item.unit_price * (item.discount || 0)) / 100;
      return sum + discountAmount;
    }, 0);
    return { subtotal, tax, total, discount: totalDiscount };
  };

  const handleCreateQuotation = async () => {
    if (!newQuote.client_id || quoteItems.length === 0) return;
    setIsSaving(true);
    
    const totals = calculateTotals();
    const result = await createQuotation({
      client_id: newQuote.client_id,
      valid_until: validUntil ? format(validUntil, 'yyyy-MM-dd') : undefined,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      terms: newQuote.terms,
      notes: newQuote.notes,
      items: quoteItems,
    });

    setIsSaving(false);
    if (result) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewQuote({ client_id: '', terms: '', notes: '' });
    setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setGstRate(18);
    setQuoteItems([]);
    setCurrentItem({ product: '', description: '', quantity: 1, unit_price: 0, discount: 0 });
  };

  const handleExport = (type: 'all' | 'accepted' | 'pending') => {
    let dataToExport = filteredQuotations;
    let filename = 'quotations';
    
    if (type === 'accepted') {
      dataToExport = filteredQuotations.filter(q => q.status === 'accepted');
      filename = 'accepted-quotations';
    } else if (type === 'pending') {
      dataToExport = filteredQuotations.filter(q => q.status === 'sent' || q.status === 'draft');
      filename = 'pending-quotations';
    }

    if (dataToExport.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    exportToCSV(
      dataToExport,
      [
        { header: 'Quote Number', accessor: 'quote_number' },
        { header: 'Client', accessor: (q: Quotation) => q.client?.company || q.client?.name || 'Unknown' },
        { header: 'Client Email', accessor: (q: Quotation) => q.client?.email || '' },
        { header: 'Valid Until', accessor: (q: Quotation) => formatDate(q.valid_until) },
        { header: 'Subtotal', accessor: 'subtotal' },
        { header: 'Tax', accessor: 'tax' },
        { header: 'Discount', accessor: 'discount' },
        { header: 'Total', accessor: 'total' },
        { header: 'Status', accessor: 'status' },
        { header: 'Created', accessor: (q: Quotation) => formatDate(q.created_at) },
      ],
      `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    );
    toast({ title: "Export successful", description: `${dataToExport.length} quotations exported` });
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
              <span className="gradient-text">QUOTATIONS</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage price quotations for clients
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
                <DropdownMenuItem onClick={() => handleExport('accepted')}>Export Accepted</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pending')}>Export Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={fetchQuotations} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={14} />
                  New Quotation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Quotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={newQuote.client_id} onValueChange={(v) => setNewQuote({ ...newQuote, client_id: v })}>
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
                      <Label>Valid Until</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !validUntil && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {validUntil ? format(validUntil, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={validUntil} onSelect={setValidUntil} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>GST Rate</Label>
                    <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v) as GSTRate)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map(rate => (
                          <SelectItem key={rate.value} value={rate.value.toString()}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Quote Items</h4>
                    <div className="grid grid-cols-6 gap-2">
                      <Input 
                        placeholder="Product" 
                        value={currentItem.product}
                        onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                        className="col-span-2"
                      />
                      <Input 
                        type="number" 
                        placeholder="Qty" 
                        value={currentItem.quantity || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                      />
                      <Input 
                        type="number" 
                        placeholder="Unit Price" 
                        value={currentItem.unit_price || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, unit_price: Number(e.target.value) })}
                      />
                      <Input 
                        type="number" 
                        placeholder="Disc %" 
                        value={currentItem.discount || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, discount: Number(e.target.value) })}
                      />
                      <Button variant="outline" onClick={handleAddItem}>Add</Button>
                    </div>
                    
                    {quoteItems.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {quoteItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × ₹{item.unit_price} 
                                {item.discount ? ` (-${item.discount}%)` : ''} 
                                = ₹{item.total.toLocaleString()}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <div className="pt-2 border-t space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{calculateTotals().subtotal.toLocaleString()}</span>
                          </div>
                          {calculateTotals().discount > 0 && (
                            <div className="flex justify-between text-accent">
                              <span>Discount</span>
                              <span>-₹{calculateTotals().discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax ({gstRate}%)</span>
                            <span>₹{calculateTotals().tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base pt-1 border-t">
                            <span>Total</span>
                            <span>₹{calculateTotals().total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Terms & Conditions</Label>
                      <Textarea 
                        placeholder="Payment terms, delivery conditions..."
                        value={newQuote.terms}
                        onChange={(e) => setNewQuote({ ...newQuote, terms: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        placeholder="Internal notes..."
                        value={newQuote.notes}
                        onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateQuotation} 
                    className="w-full" 
                    disabled={isSaving || !newQuote.client_id || quoteItems.length === 0}
                  >
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Quotation'}
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
                <p className="text-xs text-muted-foreground">Total Quotes</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <IndianRupee size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Total Quoted</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle size={16} className="text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.acceptedValue)}</p>
                <p className="text-xs text-muted-foreground">Accepted Value</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotations Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No quotations found</p>
              <p className="text-sm">Create your first quotation to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quote) => {
                  const StatusIcon = statusConfig[quote.status]?.icon || FileText;
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono font-medium">{quote.quote_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.client?.company || quote.client?.name}</p>
                          <p className="text-xs text-muted-foreground">{quote.client?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{quote.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">₹{quote.total.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(quote.created_at)}</TableCell>
                      <TableCell>{formatDate(quote.valid_until)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[quote.status]?.color || ''}`}>
                          <StatusIcon size={12} />
                          {statusConfig[quote.status]?.label || quote.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedQuote(quote); setIsViewDialogOpen(true); }}>
                            <Eye size={14} />
                          </Button>
                          {quote.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => updateQuotationStatus(quote.id, 'sent')}>
                              <Send size={14} />
                            </Button>
                          )}
                          {quote.status === 'sent' && (
                            <Button variant="ghost" size="sm" onClick={() => updateQuotationStatus(quote.id, 'accepted')}>
                              <CheckCircle size={14} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteQuotation(quote.id)}>
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

        {/* View Quote Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quotation Details</DialogTitle>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold font-mono">{selectedQuote.quote_number}</h3>
                    <p className="text-muted-foreground">{selectedQuote.client?.company || selectedQuote.client?.name}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${statusConfig[selectedQuote.status]?.color || ''}`}>
                    {statusConfig[selectedQuote.status]?.label || selectedQuote.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(selectedQuote.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">{formatDate(selectedQuote.valid_until)}</p>
                  </div>
                </div>

                {selectedQuote.items && selectedQuote.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product}</p>
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.discount || 0}%</TableCell>
                          <TableCell className="text-right">₹{item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{selectedQuote.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedQuote.discount > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>Discount</span>
                        <span>-₹{selectedQuote.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>₹{selectedQuote.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{selectedQuote.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedQuote.terms && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Terms & Conditions</p>
                    <p className="text-sm whitespace-pre-line">{selectedQuote.terms}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download size={14} /> Download PDF
                  </Button>
                  {selectedQuote.status === 'draft' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateQuotationStatus(selectedQuote.id, 'sent'); setIsViewDialogOpen(false); }}>
                      <Send size={14} /> Send to Client
                    </Button>
                  )}
                  {selectedQuote.status === 'sent' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateQuotationStatus(selectedQuote.id, 'accepted'); setIsViewDialogOpen(false); }}>
                      <CheckCircle size={14} /> Mark Accepted
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

export default Quotations;
