import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Settings,
  Shield,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image,
  Save,
  Key,
  Mail,
  User,
  Activity,
  RefreshCw,
  AlertCircle,
  Crown,
  Clock,
  Eye,
  Globe,
  FileText,
  Phone,
} from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  allowed_pages: string[];
  is_master: boolean;
  created_at: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

const allPages = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/system-status', label: 'System Status' },
  { path: '/alerts', label: 'Alerts Center' },
  { path: '/sales-forecast', label: 'Sales Forecast' },
  { path: '/demand-prediction', label: 'Demand Prediction' },
  { path: '/recommendations', label: 'Recommendations' },
  { path: '/chatbot', label: 'AI Chatbot' },
  { path: '/design-generator', label: 'Design Generator' },
  { path: '/b2b-agent', label: 'B2B Agent' },
  { path: '/production', label: 'Production' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/supply-chain', label: 'Supply Chain' },
  { path: '/quality', label: 'Quality Control' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/performance', label: 'Performance' },
  { path: '/reports', label: 'Reports' },
  { path: '/realtime', label: 'Real-time Data' },
  { path: '/buyers', label: 'Buyers' },
  { path: '/markets', label: 'Markets' },
  { path: '/clients', label: 'Clients' },
  { path: '/client-orders', label: 'Client Orders' },
  { path: '/invoices', label: 'Invoices' },
  { path: '/quotations', label: 'Quotations' },
  { path: '/agreements', label: 'Agreements' },
  { path: '/digital-signatures', label: 'Digital Signatures' },
  { path: '/settings', label: 'Settings' },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isMaster, loading, session } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [appSettings, setAppSettings] = useState({
    app_name: 'QWII',
    tagline: 'OPTIMIZE VISION',
    logo_url: '',
  });

  // Landing page content state
  const [landingContent, setLandingContent] = useState({
    hero_title: 'Transform Your Business with Intelligent AI',
    hero_subtitle: 'QWII is the ultimate AI-powered platform designed for modern businesses.',
    whatsapp_number: '917303408500',
    contact_email: 'contact@qwii.in',
    founder_1_name: 'Mayank Bajaj',
    founder_2_name: 'Himanshu Kumar',
  });

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer',
    allowed_pages: ['/dashboard'],
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!loading && user && !isMaster) {
      toast.error('Access denied. Master admin only.');
      navigate('/dashboard');
      return;
    }
  }, [user, loading, isMaster, navigate]);

  useEffect(() => {
    if (isMaster && session) {
      fetchUsers();
      fetchAppSettings();
      fetchActivities();
    }
  }, [isMaster, session]);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAppSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (data && !error) {
      const settings: Record<string, string> = {};
      data.forEach((row) => {
        settings[row.key] = row.value || '';
      });
      setAppSettings({
        app_name: settings['app_name'] || 'QWII',
        tagline: settings['tagline'] || 'OPTIMIZE VISION',
        logo_url: settings['logo_url'] || '',
      });
    }
  };

  const handleCreateUser = async () => {
    if (!session?.access_token) {
      toast.error('Not authenticated');
      return;
    }

    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          role: newUser.role,
          allowed_pages: newUser.allowed_pages,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('User created successfully');
      setIsCreateDialogOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'viewer', allowed_pages: ['/dashboard'] });
      fetchUsers();
      fetchActivities();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !session?.access_token) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('update-user', {
        body: {
          user_id: selectedUser.id,
          full_name: selectedUser.full_name,
          role: selectedUser.role,
          allowed_pages: selectedUser.allowed_pages,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchActivities();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('User deleted successfully');
      fetchUsers();
      fetchActivities();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setAppSettings({ ...appSettings, logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload logo';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      for (const [key, value] of Object.entries(appSettings)) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        
        if (error) throw error;
      }
      toast.success('Settings saved successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageAccess = (pages: string[], page: string) => {
    if (pages.includes(page)) {
      return pages.filter(p => p !== page);
    }
    return [...pages, page];
  };

  const selectAllPages = (currentPages: string[]) => {
    if (currentPages.length === allPages.length) {
      return ['/'];
    }
    return allPages.map(p => p.path);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-accent/20 text-accent';
    if (action.includes('DELETED')) return 'bg-destructive/20 text-destructive';
    if (action.includes('UPDATED')) return 'bg-warning/20 text-warning';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isMaster) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wide">
              <span className="gradient-text">MASTER ADMIN PANEL</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Full system control - User management, branding & activity logs
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 glass-card">
            <Crown size={14} className="text-warning" />
            <span className="text-xs font-mono text-warning">MASTER ACCESS</span>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users size={14} />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={14} />
              Branding
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-2">
              <Globe size={14} />
              Landing Page
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2">
              <Activity size={14} />
              Activity Log
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">User Management</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus size={14} />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to the system. They will be able to login with these credentials.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="John Doe"
                              value={newUser.full_name}
                              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="user@company.com"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Password * (min 6 characters)</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={newUser.password}
                              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Page Access</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setNewUser({
                              ...newUser,
                              allowed_pages: selectAllPages(newUser.allowed_pages)
                            })}
                          >
                            {newUser.allowed_pages.length === allPages.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <ScrollArea className="h-48 border rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-2">
                            {allPages.map((page) => (
                              <label key={page.path} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                                <Checkbox
                                  checked={newUser.allowed_pages.includes(page.path)}
                                  onCheckedChange={() => {
                                    setNewUser({
                                      ...newUser,
                                      allowed_pages: togglePageAccess(newUser.allowed_pages, page.path),
                                    });
                                  }}
                                />
                                {page.label}
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <Button onClick={handleCreateUser} className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create User'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {users.length === 0 && !isLoading ? (
              <div className="glass-card p-8 text-center">
                <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">No users found. Create your first user to get started.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Pages Access</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.full_name || 'No name'}
                            {u.is_master && <Crown size={14} className="text-warning" />}
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            u.role === 'admin' ? 'bg-destructive/20 text-destructive' :
                            u.role === 'manager' ? 'bg-warning/20 text-warning' :
                            u.role === 'staff' ? 'bg-accent/20 text-accent' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {u.allowed_pages?.length || 0} pages
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(u.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsEditDialogOpen(true);
                              }}
                              disabled={u.is_master}
                            >
                              <Edit size={14} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={u.is_master || u.id === user?.id}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {u.email}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* App Name & Tagline */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings size={16} className="text-primary" />
                  Application Identity
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Application Name</Label>
                    <Input
                      value={appSettings.app_name}
                      onChange={(e) => setAppSettings({ ...appSettings, app_name: e.target.value })}
                      placeholder="QWII"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={appSettings.tagline}
                      onChange={(e) => setAppSettings({ ...appSettings, tagline: e.target.value })}
                      placeholder="OPTIMIZE VISION"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Image size={16} className="text-primary" />
                  Logo
                </h3>
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg bg-muted/20 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {appSettings.logo_url ? (
                      <img src={appSettings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload size={24} className="mx-auto mb-2" />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 200x200px, PNG or JPG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="gap-2" disabled={isLoading}>
              <Save size={14} />
              {isLoading ? 'Saving...' : 'Save Branding Settings'}
            </Button>
          </TabsContent>

          {/* Landing Page Tab */}
          <TabsContent value="landing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hero Section */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  Hero Section
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hero Title</Label>
                    <Input
                      value={landingContent.hero_title}
                      onChange={(e) => setLandingContent({ ...landingContent, hero_title: e.target.value })}
                      placeholder="Transform Your Business with Intelligent AI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle</Label>
                    <Input
                      value={landingContent.hero_subtitle}
                      onChange={(e) => setLandingContent({ ...landingContent, hero_subtitle: e.target.value })}
                      placeholder="QWII is the ultimate AI-powered platform..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>WhatsApp Number (with country code)</Label>
                    <Input
                      value={landingContent.whatsapp_number}
                      onChange={(e) => setLandingContent({ ...landingContent, whatsapp_number: e.target.value })}
                      placeholder="917303408500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={landingContent.contact_email}
                      onChange={(e) => setLandingContent({ ...landingContent, contact_email: e.target.value })}
                      placeholder="contact@qwii.in"
                    />
                  </div>
                </div>
              </div>

              {/* Founders */}
              <div className="glass-card p-6 space-y-4 md:col-span-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Founders
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Founder 1 Name</Label>
                    <Input
                      value={landingContent.founder_1_name}
                      onChange={(e) => setLandingContent({ ...landingContent, founder_1_name: e.target.value })}
                      placeholder="Mayank Bajaj"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Founder 2 Name</Label>
                    <Input
                      value={landingContent.founder_2_name}
                      onChange={(e) => setLandingContent({ ...landingContent, founder_2_name: e.target.value })}
                      placeholder="Himanshu Kumar"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button className="gap-2" disabled={isLoading}>
                <Save size={14} />
                Save Landing Page Settings
              </Button>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <Eye size={14} />
                  Preview Landing Page
                </Button>
              </a>
            </div>

            <div className="glass-card p-4 border-warning/50">
              <p className="text-sm text-muted-foreground">
                <strong className="text-warning">Note:</strong> Landing page content management is coming soon. 
                Currently, you can preview the landing page and modify content directly in the code.
              </p>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">User Activity Log</h2>
              <Button variant="outline" size="sm" onClick={fetchActivities}>
                <RefreshCw size={14} />
              </Button>
            </div>

            {activities.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Clock className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">No activities recorded yet.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(activity.created_at)}
                        </TableCell>
                        <TableCell>{activity.user_email}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(activity.action)}>
                            {activity.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {activity.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and permissions.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={selectedUser.full_name}
                      onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(v) => setSelectedUser({ ...selectedUser, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Page Access</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser({
                        ...selectedUser,
                        allowed_pages: selectAllPages(selectedUser.allowed_pages)
                      })}
                    >
                      {selectedUser.allowed_pages.length === allPages.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <ScrollArea className="h-48 border rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {allPages.map((page) => (
                        <label key={page.path} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <Checkbox
                            checked={selectedUser.allowed_pages?.includes(page.path)}
                            onCheckedChange={() => {
                              setSelectedUser({
                                ...selectedUser,
                                allowed_pages: togglePageAccess(selectedUser.allowed_pages || [], page.path),
                              });
                            }}
                          />
                          {page.label}
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <Button onClick={handleUpdateUser} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;