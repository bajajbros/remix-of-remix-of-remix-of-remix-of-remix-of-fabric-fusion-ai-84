import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import SalesForecast from "./pages/SalesForecast";
import DemandPrediction from "./pages/DemandPrediction";
import Recommendations from "./pages/Recommendations";
import Chatbot from "./pages/Chatbot";
import DesignGenerator from "./pages/DesignGenerator";
import B2BAgent from "./pages/B2BAgent";
import SystemStatus from "./pages/SystemStatus";
import AlertsCenter from "./pages/AlertsCenter";
import Production from "./pages/Production";
import Inventory from "./pages/Inventory";
import SupplyChain from "./pages/SupplyChain";
import QualityControl from "./pages/QualityControl";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import RealTimeData from "./pages/RealTimeData";
import Buyers from "./pages/Buyers";
import Markets from "./pages/Markets";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";
import ClientOrders from "./pages/ClientOrders";
import Invoices from "./pages/Invoices";
import Quotations from "./pages/Quotations";
import Agreements from "./pages/Agreements";
import DigitalSignatures from "./pages/DigitalSignatures";
import ClientPortal from "./pages/ClientPortal";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import NotFound from "./pages/NotFound";
import SharedInvoice from "./pages/SharedInvoice";
import SharedAgreement from "./pages/SharedAgreement";
import SharedQuotation from "./pages/SharedQuotation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/portal/:token" element={<ClientPortal />} />
              <Route path="/invoice/:token" element={<SharedInvoice />} />
              <Route path="/agreement/:token" element={<SharedAgreement />} />
              <Route path="/quotation/:token" element={<SharedQuotation />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              
              {/* Command Center */}
              <Route path="/system-status" element={<ProtectedRoute><SystemStatus /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsCenter /></ProtectedRoute>} />
              
              {/* AI Intelligence */}
              <Route path="/sales-forecast" element={<ProtectedRoute><SalesForecast /></ProtectedRoute>} />
              <Route path="/demand-prediction" element={<ProtectedRoute><DemandPrediction /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
              <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
              <Route path="/design-generator" element={<ProtectedRoute><DesignGenerator /></ProtectedRoute>} />
              <Route path="/b2b-agent" element={<ProtectedRoute><B2BAgent /></ProtectedRoute>} />
              
              {/* Client Services */}
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/client-orders" element={<ProtectedRoute><ClientOrders /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/agreements" element={<ProtectedRoute><Agreements /></ProtectedRoute>} />
              <Route path="/digital-signatures" element={<ProtectedRoute><DigitalSignatures /></ProtectedRoute>} />
              
              {/* Operations */}
              <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute><QualityControl /></ProtectedRoute>} />
              
              {/* Analytics */}
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/realtime" element={<ProtectedRoute><RealTimeData /></ProtectedRoute>} />
              
              {/* Management */}
              <Route path="/buyers" element={<ProtectedRoute><Buyers /></ProtectedRoute>} />
              <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
