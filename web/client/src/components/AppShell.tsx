import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, Dumbbell, History, LayoutDashboard, LineChart, LogOut, Plus, Settings, Sparkles, Split, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/splits", label: "Splits", icon: Split },
  { href: "/programs", label: "Programs", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/history", label: "History", icon: History },
];

export function LoginScreen() {
  return (
    <main className="login-screen">
      <div className="login-mark"><span>GP</span></div>
      <p className="eyebrow">GYM PROGRESS PRO</p>
      <h1>Make the next<br /><em>set count.</em></h1>
      <p className="login-copy">A focused training log for lifters who want their next session to be obvious.</p>
      <button className="primary-button login-button" onClick={() => startLogin()}>
        Continue with Manus <span>→</span>
      </button>
      <p className="login-note">Your workouts are private and synced to your account.</p>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <div className="loading-screen"><div className="pulse-dot" />Checking your session…</div>;
  if (!auth.isAuthenticated) return <LoginScreen />;
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = auth.user?.name?.split(" ")[0] || "Athlete";
  const initials = (auth.user?.name || "A").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`side-rail ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup"><div className="brand-mark">GP</div><div><strong>Gym Progress</strong><span>PRO / WEB</span></div></div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
        <nav className="main-nav">
          <p className="nav-label">TRAINING ROOM</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`nav-link ${active ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{active && <i />}</Link>;
          })}
        </nav>
        <div className="rail-bottom">
          <Link href="/settings" className={`nav-link ${location.startsWith("/settings") ? "active" : ""}`}><Settings size={18} strokeWidth={1.8} /><span>Settings</span></Link>
          <div className="user-chip"><div className="avatar">{initials}</div><div className="user-info"><strong>{displayName}</strong><span>{auth.user?.email || "Signed in"}</span></div><button onClick={() => auth.logout()} aria-label="Log out"><LogOut size={16} /></button></div>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <main className="main-column">
        <header className="topbar"><button className="menu-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu"><span /><span /><span /></button><div className="topbar-context"><span className="live-dot" /> TRAINING LOG <span className="slash">/</span> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</div><Link href="/workout/new" className="topbar-action"><Plus size={16} /> Log workout</Link></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Dumbbell size={22} /></div><h3>{title}</h3><p>{copy}</p>{action}</div>;
}

export function RecommendationCard({ exerciseName, recommendation, reason, confidence, autoregulation }: { exerciseName: string; recommendation: string; reason?: string; confidence?: string; autoregulation?: { action: string; observedRpe: number | null; observedRir: number | null; proposedLoad: number; chosenLoad: number; manualAcceptanceRequired: boolean } }) {
  const adjusted = autoregulation && autoregulation.action !== "hold_load";
  const effort = autoregulation?.observedRpe != null ? `RPE ${autoregulation.observedRpe.toFixed(1)}` : autoregulation?.observedRir != null ? `${autoregulation.observedRir.toFixed(1)} RIR` : null;
  return <div className="recommendation-card"><div className="spark-icon"><Sparkles size={18} /></div><div><p className="eyebrow">NEXT SESSION / {exerciseName}{confidence ? ` · ${confidence.toUpperCase()} SIGNAL` : ""}</p><strong>{recommendation}</strong>{adjusted && <small className="recommendation-adjustment">AUTO-REG / {autoregulation.action.replaceAll("_", " ")} {effort ? `· observed ${effort}` : ""} · review before logging</small>}{reason && <small className="recommendation-reason">{reason}</small>}</div></div>;
}
