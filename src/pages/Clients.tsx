import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients, CreateClientInput } from '@/hooks/useClients';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  FileText,
  Download,
  MoreVertical,
  Star,
  TrendingUp,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Client } from '@/hooks/useClients';

const Clients = () => {
  const { clients, loading, stats, createClient, updateClient, deleteClient, fetchClients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newClient, setNewClient] = useState<CreateClientInput>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    gst_number: '',
    pan_number: '',
    credit_limit: 0,
    notes: '',
    status: 'active',
    type: 'regular',
  });

  const [editClient, setEditClient] = useState<CreateClientInput>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    gst_number: '',
    pan_number: '',
    credit_limit: 0,
    notes: '',
    status: 'active',
    type: 'regular',
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return;
    setIsSaving(true);
    const result = await createClient(newClient);
    setIsSaving(false);
    if (result) {
      setIsAddDialogOpen(false);
      resetNewClient();
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient || !editClient.name.trim()) return;
    setIsSaving(true);
    const success = await updateClient(selectedClient.id, editClient);
    setIsSaving(false);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedClient(null);
    }
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setEditClient({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || 'India',
      gst_number: client.gst_number || '',
      pan_number: client.pan_number || '',
      credit_limit: client.credit_limit,
      notes: client.notes || '',
      status: client.status,
      type: client.type,
    });
    setIsEditDialogOpen(true);
  };

  const resetNewClient = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      gst_number: '',
      pan_number: '',
      credit_limit: 0,
      notes: '',
      status: 'active',
      type: 'regular',
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide">
              <span className="gradient-text">CLIENT MANAGEMENT</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your business clients and their accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchClients} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={14} />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Name *</Label>
                      <Input
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={newClient.company}
                        onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                        placeholder="ABC Textiles Pvt Ltd"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newClient.phone}
                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={newClient.city}
                        onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={newClient.state}
                        onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={newClient.country} onValueChange={(v) => setNewClient({ ...newClient, country: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="USA">USA</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="UAE">UAE</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        value={newClient.gst_number}
                        onChange={(e) => setNewClient({ ...newClient, gst_number: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN Number</Label>
                      <Input
                        value={newClient.pan_number}
                        onChange={(e) => setNewClient({ ...newClient, pan_number: e.target.value })}
                        placeholder="AAAAA0000A"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Credit Limit (₹)</Label>
                      <Input
                        type="number"
                        value={newClient.credit_limit}
                        onChange={(e) => setNewClient({ ...newClient, credit_limit: Number(e.target.value) })}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newClient.status} onValueChange={(v: any) => setNewClient({ ...newClient, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newClient.type} onValueChange={(v: any) => setNewClient({ ...newClient, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={newClient.notes}
                      onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                      placeholder="Any additional notes about this client..."
                    />
                  </div>
                  <Button onClick={handleAddClient} className="w-full" disabled={isSaving || !newClient.name.trim()}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Client'}
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
                <Users size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <DollarSign size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <TrendingUp size={16} className="text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download size={14} />
            Export
          </Button>
        </div>

        {/* Clients Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No clients found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {clients.length === 0 ? "Add your first client to get started" : "Try adjusting your search filters"}
              </p>
              {clients.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus size={14} />
                  Add First Client
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.company || client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.total_orders} orders</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{client.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail size={10} />
                          {client.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin size={12} className="text-muted-foreground" />
                        {client.city || 'N/A'}{client.country ? `, ${client.country}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(client.credit_limit)}</TableCell>
                    <TableCell>
                      <span className={client.outstanding_amount > client.credit_limit * 0.8 ? 'text-destructive' : ''}>
                        {formatCurrency(client.outstanding_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        client.type === 'vip' ? 'bg-primary/20 text-primary' :
                        client.type === 'premium' ? 'bg-secondary/20 text-secondary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {client.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        client.status === 'active' ? 'bg-accent/20 text-accent' :
                        client.status === 'pending' ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {client.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedClient(client); setIsViewDialogOpen(true); }}>
                            <FileText size={14} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {client.phone && (
                            <DropdownMenuItem onClick={() => window.open(`tel:${client.phone}`)}>
                              <Phone size={14} className="mr-2" />
                              Call
                            </DropdownMenuItem>
                          )}
                          {client.email && (
                            <DropdownMenuItem onClick={() => window.open(`mailto:${client.email}`)}>
                              <Mail size={14} className="mr-2" />
                              Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* View Client Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 size={32} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedClient.company || selectedClient.name}</h3>
                    <p className="text-muted-foreground">{selectedClient.name}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      selectedClient.type === 'vip' ? 'bg-primary/20 text-primary' :
                      selectedClient.type === 'premium' ? 'bg-secondary/20 text-secondary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {selectedClient.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-muted-foreground" />
                      <span className="text-sm">{selectedClient.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground" />
                      <span className="text-sm">{selectedClient.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-muted-foreground" />
                      <span className="text-sm">
                        {[selectedClient.address, selectedClient.city, selectedClient.state, selectedClient.country]
                          .filter(Boolean).join(', ') || 'No address'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">GST Number</p>
                      <p className="font-mono text-sm">{selectedClient.gst_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PAN Number</p>
                      <p className="font-mono text-sm">{selectedClient.pan_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(selectedClient.credit_limit)}</p>
                    <p className="text-xs text-muted-foreground">Credit Limit</p>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <p className="text-2xl font-bold text-warning">{formatCurrency(selectedClient.outstanding_amount)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <p className="text-2xl font-bold text-accent">{selectedClient.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                </div>

                {selectedClient.notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{selectedClient.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={() => openEditDialog(selectedClient)}>
                    <Edit size={14} />
                    Edit Client
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => selectedClient.email && window.open(`mailto:${selectedClient.email}`)}>
                    <Mail size={14} />
                    Send Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input
                    value={editClient.name}
                    onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={editClient.company}
                    onChange={(e) => setEditClient({ ...editClient, company: e.target.value })}
                    placeholder="ABC Textiles Pvt Ltd"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editClient.email}
                    onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editClient.phone}
                    onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editClient.address}
                  onChange={(e) => setEditClient({ ...editClient, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={editClient.city}
                    onChange={(e) => setEditClient({ ...editClient, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={editClient.state}
                    onChange={(e) => setEditClient({ ...editClient, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={editClient.country} onValueChange={(v) => setEditClient({ ...editClient, country: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="UAE">UAE</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={editClient.gst_number}
                    onChange={(e) => setEditClient({ ...editClient, gst_number: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input
                    value={editClient.pan_number}
                    onChange={(e) => setEditClient({ ...editClient, pan_number: e.target.value })}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Credit Limit (₹)</Label>
                  <Input
                    type="number"
                    value={editClient.credit_limit}
                    onChange={(e) => setEditClient({ ...editClient, credit_limit: Number(e.target.value) })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editClient.status} onValueChange={(v: any) => setEditClient({ ...editClient, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editClient.type} onValueChange={(v: any) => setEditClient({ ...editClient, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editClient.notes}
                  onChange={(e) => setEditClient({ ...editClient, notes: e.target.value })}
                  placeholder="Any additional notes about this client..."
                />
              </div>
              <Button onClick={handleUpdateClient} className="w-full" disabled={isSaving || !editClient.name.trim()}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
