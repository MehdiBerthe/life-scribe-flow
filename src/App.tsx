import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Planning from "./pages/Planning";
import Reading from "./pages/Reading";
import Finance from "./pages/Finance";
import Physical from "./pages/Physical";
import Social from "./pages/Social";
import AICopilotPage from "./pages/AICopilotPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/reading" element={<Reading />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/physical" element={<Physical />} />
              <Route path="/social" element={<Social />} />
              <Route path="/ai-copilot" element={<AICopilotPage />} />
              {/* Legacy routes for backwards compatibility */}
              <Route path="/goals" element={<Planning />} />
              <Route path="/review" element={<Planning />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
