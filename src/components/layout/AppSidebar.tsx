import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  MessageSquareText,
  Palette,
  Bot,
  ChevronLeft,
  ChevronDown,
  Activity,
  Package,
  Users,
  FileBarChart,
  Bell,
  Settings,
  Shield,
  Zap,
  Brain,
  Cpu,
  BarChart3,
  PieChart,
  LineChart,
  Boxes,
  Truck,
  Factory,
  Gauge,
  AlertTriangle,
  Clock,
  Globe,
  UserCheck,
  ShoppingCart,
  FileText,
  Receipt,
  PenTool,
  Handshake,
  LogOut,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { isPreviewDomain } from '@/hooks/usePreviewMode';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface MenuGroup {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Command Center',
    icon: Cpu,
    defaultOpen: true,
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'System Status', url: '/system-status', icon: Activity, badge: 'Live', badgeColor: 'accent' },
      { title: 'Alerts Center', url: '/alerts', icon: AlertTriangle, badge: '3', badgeColor: 'warning' },
    ],
  },
  {
    title: 'AI Intelligence',
    icon: Brain,
    defaultOpen: true,
    items: [
      { title: 'Sales Forecast', url: '/sales-forecast', icon: TrendingUp },
      { title: 'Demand Prediction', url: '/demand-prediction', icon: LineChart },
      { title: 'Product Recommendations', url: '/recommendations', icon: Target },
      { title: 'AI Chatbot', url: '/chatbot', icon: MessageSquareText },
      { title: 'Design Generator', url: '/design-generator', icon: Palette },
      { title: 'B2B AI Agent', url: '/b2b-agent', icon: Bot },
    ],
  },
  {
    title: 'Client Services',
    icon: UserCheck,
    defaultOpen: true,
    items: [
      { title: 'Clients', url: '/clients', icon: Users },
      { title: 'Client Orders', url: '/client-orders', icon: ShoppingCart },
      { title: 'Invoices', url: '/invoices', icon: Receipt },
      { title: 'Quotations', url: '/quotations', icon: FileText },
      { title: 'Agreements', url: '/agreements', icon: Handshake },
      { title: 'Digital Signatures', url: '/digital-signatures', icon: PenTool },
    ],
  },
  {
    title: 'Operations',
    icon: Factory,
    items: [
      { title: 'Production Planning', url: '/production', icon: Boxes },
      { title: 'Inventory Management', url: '/inventory', icon: Package },
      { title: 'Supply Chain', url: '/supply-chain', icon: Truck },
      { title: 'Quality Control', url: '/quality', icon: Shield },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    items: [
      { title: 'Business Intelligence', url: '/analytics', icon: PieChart },
      { title: 'Performance Metrics', url: '/performance', icon: Gauge },
      { title: 'Reports', url: '/reports', icon: FileBarChart },
      { title: 'Real-time Data', url: '/realtime', icon: Clock },
    ],
  },
  {
    title: 'Management',
    icon: Users,
    items: [
      { title: 'Buyer Management', url: '/buyers', icon: Users },
      { title: 'Global Markets', url: '/markets', icon: Globe },
      { title: 'Notifications', url: '/notifications', icon: Bell },
      { title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const { user, isMaster, allowedPages, signOut } = useAuth();
  const { settings } = useAppSettings();
  const isCollapsed = state === 'collapsed';
  const [openGroups, setOpenGroups] = useState<string[]>(
    menuGroups.filter(g => g.defaultOpen).map(g => g.title)
  );

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to logout');
    }
  };

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Check if we're in preview mode
  const isPreview = isPreviewDomain();

  // Filter menu items based on user's allowed pages
  const getFilteredGroups = () => {
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // In preview mode, show all pages including admin
        if (isPreview) return true;
        
        // Admin Panel is removed from sidebar completely for non-preview
        if (item.url === '/admin') return false;
        
        // Master users can see all pages
        if (isMaster) return true;
        
        // Regular users only see their allowed pages
        return allowedPages.includes(item.url);
      })
    })).filter(group => group.items.length > 0); // Remove empty groups
  };

  const filteredGroups = getFilteredGroups();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.app_name}
                className="w-10 h-10 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full status-online" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-display font-bold text-sm text-sidebar-foreground tracking-wide">
                {settings.app_name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
                {settings.tagline}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="sidebar-scroll px-2 py-3">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.title} className="mb-1">
            <Collapsible
              open={isCollapsed || openGroups.includes(group.title)}
              onOpenChange={() => !isCollapsed && toggleGroup(group.title)}
            >
              {!isCollapsed && (
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <group.icon size={12} className="text-primary/60" />
                      {group.title}
                    </div>
                    <ChevronDown
                      size={12}
                      className={cn(
                        'transition-transform duration-200',
                        openGroups.includes(group.title) && 'rotate-180'
                      )}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
              )}

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            className={cn(
                              'group relative h-9 transition-all duration-200',
                              isActive
                                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-2">
                              <item.icon
                                size={16}
                                className={cn(
                                  'shrink-0 transition-colors',
                                  isActive ? 'text-primary' : 'group-hover:text-primary'
                                )}
                              />
                              {!isCollapsed && (
                                <>
                                  <span className="text-sm font-medium truncate flex-1">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                        item.badgeColor === 'accent' && 'bg-accent/20 text-accent',
                                        item.badgeColor === 'warning' && 'bg-warning/20 text-warning',
                                        !item.badgeColor && 'bg-primary/20 text-primary'
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}

        {/* Master Admin Link - Only visible to master users */}
        {isMaster && !isCollapsed && (
          <div className="mt-4 px-2">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Shield size={14} />
              <span className="text-sm font-medium">Master Admin</span>
            </Link>
          </div>
        )}
      </SidebarContent>

      {/* Footer with User Profile */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors',
              isCollapsed && 'justify-center'
            )}>
              <Avatar className="w-8 h-8 border-2 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(user?.user_metadata?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <User size={16} />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isCollapsed && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full status-online" />
              <span className="text-xs text-muted-foreground font-mono">v2.4.1</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
        
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground mx-auto mt-2"
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;