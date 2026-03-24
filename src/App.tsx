import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Result from "./pages/Result.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import MarketAnalysis from "./pages/MarketAnalysis.tsx";
import Database from "./pages/Database.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import OpportunityRadar from "./pages/OpportunityRadar.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/result" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/market" element={<MarketAnalysis />} />
          <Route path="/database" element={<Database />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/radar" element={<OpportunityRadar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
