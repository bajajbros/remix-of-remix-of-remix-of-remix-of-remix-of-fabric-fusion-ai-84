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
import { useInvoices, Invoice, CreateInvoiceItemInput } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useClientOrders } from '@/hooks/useClientOrders';
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
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

const statusConfig = {
  draft: { color: 'bg-muted text-muted-foreground', icon: FileText, label: 'Draft' },
  sent: { color: 'bg-primary/20 text-primary', icon: Send, label: 'Sent' },
  paid: { color: 'bg-accent/20 text-accent', icon: CheckCircle, label: 'Paid' },
  overdue: { color: 'bg-destructive/20 text-destructive', icon: AlertCircle, label: 'Overdue' },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Cancelled' },
};

const Invoices = () => {
  const { invoices, loading, stats, createInvoice, updateInvoiceStatus, deleteInvoice, fetchInvoices } = useInvoices();
  const { clients } = useClients();
  const { orders } = useClientOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    order_id: '',
    notes: '',
  });
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
  const [gstType, setGstType] = useState<'intra' | 'inter'>('intra');
  const [gstRate, setGstRate] = useState<GSTRate>(18);
  const [invoiceItems, setInvoiceItems] = useState<CreateInvoiceItemInput[]>([]);
  const [currentItem, setCurrentItem] = useState({ description: '', quantity: 1, rate: 0 });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    if (!currentItem.description || currentItem.quantity <= 0 || currentItem.rate <= 0) return;
    const newItem: CreateInvoiceItemInput = {
      ...currentItem,
      amount: currentItem.quantity * currentItem.rate,
    };
    setInvoiceItems([...invoiceItems, newItem]);
    setCurrentItem({ description: '', quantity: 1, rate: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const { tax } = calculateGST(subtotal, gstRate);
    const cgst = gstType === 'intra' ? tax / 2 : 0;
    const sgst = gstType === 'intra' ? tax / 2 : 0;
    const igst = gstType === 'inter' ? tax : 0;
    const total = subtotal + tax;
    return { subtotal, cgst, sgst, igst, total };
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.client_id || invoiceItems.length === 0) return;
    setIsSaving(true);
    
    const totals = calculateTotals();
    const result = await createInvoice({
      client_id: newInvoice.client_id,
      order_id: newInvoice.order_id || undefined,
      issue_date: issueDate ? format(issueDate, 'yyyy-MM-dd') : undefined,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      total: totals.total,
      notes: newInvoice.notes,
      items: invoiceItems,
    });

    setIsSaving(false);
    if (result) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewInvoice({ client_id: '', order_id: '', notes: '' });
    setIssueDate(new Date());
    setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
    setGstType('intra');
    setGstRate(18);
    setInvoiceItems([]);
    setCurrentItem({ description: '', quantity: 1, rate: 0 });
  };

  const handleExport = (type: 'all' | 'paid' | 'pending') => {
    let dataToExport = filteredInvoices;
    let filename = 'invoices';
    
    if (type === 'paid') {
      dataToExport = filteredInvoices.filter(i => i.status === 'paid');
      filename = 'paid-invoices';
    } else if (type === 'pending') {
      dataToExport = filteredInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
      filename = 'pending-invoices';
    }

    if (dataToExport.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    exportToCSV(
      dataToExport,
      [
        { header: 'Invoice Number', accessor: 'invoice_number' },
        { header: 'Client', accessor: (i: Invoice) => i.client?.company || i.client?.name || 'Unknown' },
        { header: 'GST Number', accessor: (i: Invoice) => i.client?.gst_number || '' },
        { header: 'Issue Date', accessor: (i: Invoice) => formatDate(i.issue_date) },
        { header: 'Due Date', accessor: (i: Invoice) => formatDate(i.due_date) },
        { header: 'Subtotal', accessor: 'subtotal' },
        { header: 'CGST', accessor: 'cgst' },
        { header: 'SGST', accessor: 'sgst' },
        { header: 'IGST', accessor: 'igst' },
        { header: 'Total', accessor: 'total' },
        { header: 'Status', accessor: 'status' },
        { header: 'Payment Date', accessor: (i: Invoice) => formatDate(i.payment_date) },
      ],
      `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    );
    toast({ title: "Export successful", description: `${dataToExport.length} invoices exported` });
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
              <span className="gradient-text">INVOICES</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and manage GST compliant invoices
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
                <DropdownMenuItem onClick={() => handleExport('paid')}>Export Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pending')}>Export Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={fetchInvoices} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={14} />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={newInvoice.client_id} onValueChange={(v) => setNewInvoice({ ...newInvoice, client_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              <div>
                                <span className="font-medium">{client.company || client.name}</span>
                                {client.gst_number && <span className="text-xs text-muted-foreground ml-2">({client.gst_number})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Order (Optional)</Label>
                      <Select value={newInvoice.order_id} onValueChange={(v) => setNewInvoice({ ...newInvoice, order_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders.filter(o => o.client_id === newInvoice.client_id || !newInvoice.client_id).map(order => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.order_number} - ₹{order.total_amount.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !issueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {issueDate ? format(issueDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GST Type</Label>
                      <Select value={gstType} onValueChange={(v: 'intra' | 'inter') => setGstType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intra">Intra-State (CGST + SGST)</SelectItem>
                          <SelectItem value="inter">Inter-State (IGST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>GST Rate</Label>
                      <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v) as GSTRate)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map(rate => (
                            <SelectItem key={rate.value} value={rate.value.toString()}>{rate.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Invoice Items</h4>
                    <div className="grid grid-cols-5 gap-2">
                      <Input 
                        placeholder="Description" 
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
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
                        placeholder="Rate" 
                        value={currentItem.rate || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, rate: Number(e.target.value) })}
                      />
                      <Button variant="outline" onClick={handleAddItem}>Add</Button>
                    </div>
                    
                    {invoiceItems.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {invoiceItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × ₹{item.rate} = ₹{item.amount.toLocaleString()}
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
                          {gstType === 'intra' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">CGST ({gstRate/2}%)</span>
                                <span>₹{calculateTotals().cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">SGST ({gstRate/2}%)</span>
                                <span>₹{calculateTotals().sgst.toLocaleString()}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IGST ({gstRate}%)</span>
                              <span>₹{calculateTotals().igst.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-base pt-1 border-t">
                            <span>Total</span>
                            <span>₹{calculateTotals().total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Additional notes..."
                      value={newInvoice.notes}
                      onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateInvoice} 
                    className="w-full" 
                    disabled={isSaving || !newInvoice.client_id || invoiceItems.length === 0}
                  >
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Invoice'}
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
                <IndianRupee size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Invoiced</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</p>
                <p className="text-xs text-muted-foreground">Received</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
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
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm">Create your first invoice to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.client?.company || invoice.client?.name}</p>
                          <p className="text-xs text-muted-foreground">{invoice.client?.gst_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{invoice.total.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig[invoice.status]?.color || ''}`}>
                          <StatusIcon size={12} />
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setIsViewDialogOpen(true); }}>
                            <Eye size={14} />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => updateInvoiceStatus(invoice.id, 'sent')}>
                              <Send size={14} />
                            </Button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <Button variant="ghost" size="sm" onClick={() => updateInvoiceStatus(invoice.id, 'paid')}>
                              <CheckCircle size={14} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteInvoice(invoice.id)}>
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

        {/* View Invoice Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6 p-4 bg-background border rounded-lg">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold gradient-text">QWII</h2>
                    <p className="text-sm text-muted-foreground">OPTIMIZE VISION</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">TAX INVOICE</h3>
                    <p className="font-mono text-lg">{selectedInvoice.invoice_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bill To:</p>
                    <p className="font-semibold">{selectedInvoice.client?.company || selectedInvoice.client?.name}</p>
                    {selectedInvoice.client?.gst_number && (
                      <p className="text-sm">GSTIN: {selectedInvoice.client.gst_number}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{formatDate(selectedInvoice.issue_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{formatDate(selectedInvoice.due_date)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate.toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedInvoice.cgst > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CGST</span>
                          <span>₹{selectedInvoice.cgst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SGST</span>
                          <span>₹{selectedInvoice.sgst.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    {selectedInvoice.igst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IGST</span>
                        <span>₹{selectedInvoice.igst.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{selectedInvoice.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download size={14} /> Download PDF
                  </Button>
                  {selectedInvoice.status === 'draft' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateInvoiceStatus(selectedInvoice.id, 'sent'); setIsViewDialogOpen(false); }}>
                      <Send size={14} /> Send to Client
                    </Button>
                  )}
                  {selectedInvoice.status === 'sent' && (
                    <Button className="flex-1 gap-2" onClick={() => { updateInvoiceStatus(selectedInvoice.id, 'paid'); setIsViewDialogOpen(false); }}>
                      <CheckCircle size={14} /> Mark as Paid
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

export default Invoices;
