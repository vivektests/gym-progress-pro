import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell, ProtectedRoute } from "./components/AppShell";
import Home from "./pages/Home";
import Splits from "./pages/Splits";
import WorkoutNew from "./pages/WorkoutNew";
import WorkoutLog from "./pages/WorkoutLog";
import Progress from "./pages/Progress";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

function PrivatePage({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>;
}

function Router() {
  return <Switch>
    <Route path="/"><PrivatePage><Home /></PrivatePage></Route>
    <Route path="/splits"><PrivatePage><Splits /></PrivatePage></Route>
    <Route path="/workout/new"><PrivatePage><WorkoutNew /></PrivatePage></Route>
    <Route path="/workout/:id"><PrivatePage><WorkoutLog /></PrivatePage></Route>
    <Route path="/progress"><PrivatePage><Progress /></PrivatePage></Route>
    <Route path="/analytics"><PrivatePage><Analytics /></PrivatePage></Route>
    <Route path="/history"><PrivatePage><History /></PrivatePage></Route>
    <Route path="/history/:id"><PrivatePage><WorkoutLog readOnly /></PrivatePage></Route>
    <Route path="/settings"><PrivatePage><Settings /></PrivatePage></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
