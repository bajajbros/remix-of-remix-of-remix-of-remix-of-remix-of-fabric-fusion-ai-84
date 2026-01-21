import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useClientOrders, ClientOrder, CreateOrderItemInput } from '@/hooks/useClientOrders';
import { useClients } from '@/hooks/useClients';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  IndianRupee,
  Loader2,
  AlertCircle,
  Factory,
  PackageCheck,
} from 'lucide-react';

const statusConfig: Record<ClientOrder['status'], { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning bg-warning/20', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-accent bg-accent/20', label: 'Confirmed' },
  in_production: { icon: Factory, color: 'text-primary bg-primary/20', label: 'In Production' },
  ready: { icon: PackageCheck, color: 'text-secondary bg-secondary/20', label: 'Ready' },
  dispatched: { icon: Truck, color: 'text-primary bg-primary/20', label: 'Dispatched' },
  delivered: { icon: Package, color: 'text-accent bg-accent/20', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-destructive bg-destructive/20', label: 'Cancelled' },
};

const paymentStatusConfig: Record<ClientOrder['payment_status'], { color: string; label: string }> = {
  unpaid: { color: 'text-destructive bg-destructive/20', label: 'Unpaid' },
  partial: { color: 'text-warning bg-warning/20', label: 'Partial' },
  paid: { color: 'text-accent bg-accent/20', label: 'Paid' },
};

const ClientOrders = () => {
  const { orders, loading, stats, createOrder, updateOrderStatus, updatePaymentStatus, deleteOrder, fetchOrders } = useClientOrders();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    client_id: '',
    expected_delivery: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<CreateOrderItemInput[]>([]);
  const [currentItem, setCurrentItem] = useState({
    product_name: '',
    sku: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (order.client?.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    if (!currentItem.product_name || currentItem.quantity <= 0 || currentItem.unit_price <= 0) return;
    const newItem: CreateOrderItemInput = {
      ...currentItem,
      total_price: currentItem.quantity * currentItem.unit_price,
    };
    setOrderItems([...orderItems, newItem]);
    setCurrentItem({ product_name: '', sku: '', quantity: 1, unit: 'pcs', unit_price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.18; // 18% GST
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateOrder = async () => {
    if (!newOrder.client_id || orderItems.length === 0) return;
    setIsSaving(true);
    
    const totals = calculateTotals();
    const result = await createOrder({
      client_id: newOrder.client_id,
      expected_delivery: newOrder.expected_delivery || undefined,
      priority: newOrder.priority,
      notes: newOrder.notes || undefined,
      subtotal: totals.subtotal,
      tax_amount: totals.tax,
      total_amount: totals.total,
      items: orderItems,
    });

    setIsSaving(false);
    if (result) {
      setIsCreateDialogOpen(false);
      resetNewOrder();
    }
  };

  const resetNewOrder = () => {
    setNewOrder({ client_id: '', expected_delivery: '', priority: 'normal', notes: '' });
    setOrderItems([]);
    setCurrentItem({ product_name: '', sku: '', quantity: 1, unit: 'pcs', unit_price: 0 });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const handleStatusChange = async (orderId: string, newStatus: ClientOrder['status']) => {
    await updateOrderStatus(orderId, newStatus);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide">
              <span className="gradient-text">CLIENT ORDERS</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage all client orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={14} />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={newOrder.client_id} onValueChange={(v) => setNewOrder({ ...newOrder, client_id: v })}>
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
                      <Label>Expected Delivery</Label>
                      <Input 
                        type="date" 
                        value={newOrder.expected_delivery}
                        onChange={(e) => setNewOrder({ ...newOrder, expected_delivery: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newOrder.priority} onValueChange={(v: any) => setNewOrder({ ...newOrder, priority: v })}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Order Items</h4>
                    <div className="grid grid-cols-6 gap-2">
                      <Input 
                        placeholder="Product Name" 
                        value={currentItem.product_name}
                        onChange={(e) => setCurrentItem({ ...currentItem, product_name: e.target.value })}
                        className="col-span-2"
                      />
                      <Input 
                        placeholder="SKU" 
                        value={currentItem.sku}
                        onChange={(e) => setCurrentItem({ ...currentItem, sku: e.target.value })}
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
                      <Button variant="outline" onClick={handleAddItem}>Add</Button>
                    </div>
                    
                    {orderItems.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {orderItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.sku && `SKU: ${item.sku} • `}
                                {item.quantity} × ₹{item.unit_price} = ₹{item.total_price.toLocaleString()}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{calculateTotals().subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>₹{calculateTotals().tax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>₹{calculateTotals().total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Order Notes</Label>
                    <Textarea 
                      placeholder="Any special instructions..."
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateOrder} 
                    className="w-full" 
                    disabled={isSaving || !newOrder.client_id || orderItems.length === 0}
                  >
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Order'}
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
                <ShoppingCart size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
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
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_production">In Production</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download size={14} />
            Export
          </Button>
        </div>

        {/* Orders Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-32" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No orders found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {orders.length === 0 ? "Create your first order to get started" : "Try adjusting your search filters"}
              </p>
              {orders.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus size={14} />
                  Create First Order
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-medium">{order.order_number}</p>
                          {order.priority === 'urgent' && (
                            <span className="text-xs text-destructive">URGENT</span>
                          )}
                          {order.priority === 'high' && (
                            <span className="text-xs text-warning">HIGH PRIORITY</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.client?.company || order.client?.name || 'Unknown Client'}</p>
                          <p className="text-xs text-muted-foreground">{order.client?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.items?.length || 0} items</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                      </TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v as ClientOrder['status'])}>
                          <SelectTrigger className={`w-36 h-8 text-xs ${statusConfig[order.status].color}`}>
                            <StatusIcon size={12} className="mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_production">In Production</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusConfig[order.payment_status].color}`}>
                          {paymentStatusConfig[order.payment_status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{new Date(order.order_date).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedOrder(order); setIsViewDialogOpen(true); }}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 size={14} />
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

        {/* View Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-mono">{selectedOrder.order_number}</h3>
                    <p className="text-muted-foreground">{selectedOrder.client?.company || selectedOrder.client?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status].color}`}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">
                      {selectedOrder.expected_delivery 
                        ? new Date(selectedOrder.expected_delivery).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{selectedOrder.priority}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusConfig[selectedOrder.payment_status].color}`}>
                      {paymentStatusConfig[selectedOrder.payment_status].label}
                    </span>
                  </div>
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="font-mono text-xs">{item.sku || '-'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.total_price.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{selectedOrder.tax_amount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.paid_amount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Paid</span>
                      <span>₹{selectedOrder.paid_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientOrders;
