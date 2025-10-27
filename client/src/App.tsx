import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Cases from "@/pages/cases";
import NewCase from "@/pages/new-case";
import CaseDetail from "@/pages/case-detail";
import Documents from "@/pages/documents";
import UploadDocument from "@/pages/upload-document";
import DocumentDetail from "@/pages/document-detail";
import Chat from "@/pages/chat";
import Calendar from "@/pages/calendar";
import Research from "@/pages/research";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cases" component={Cases} />
      <Route path="/cases/new" component={NewCase} />
      <Route path="/cases/:id" component={CaseDetail} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/upload" component={UploadDocument} />
      <Route path="/documents/:id" component={DocumentDetail} />
      <Route path="/chat" component={Chat} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/research" component={Research} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between p-4 border-b sticky top-0 z-50 bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
