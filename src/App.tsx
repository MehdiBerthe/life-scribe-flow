import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Planning from "./pages/Planning";
import Reading from "./pages/Reading";
import Finance from "./pages/Finance";
import Physical from "./pages/Physical";
import Social from "./pages/Social";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/planning" element={<Planning />} />
                    <Route path="/reading" element={<Reading />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/physical" element={<Physical />} />
                    <Route path="/social" element={<Social />} />
                    {/* Legacy routes for backwards compatibility */}
                    <Route path="/goals" element={<Planning />} />
                    <Route path="/review" element={<Planning />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
