import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader } from "@/components/AppShell";

export default function Settings() {
  const auth = useAuth();
  return <><PageHeader eyebrow="TRAINING ROOM / SETTINGS" title="Keep it personal." description="Your account and training data stay scoped to your Manus identity." action={<Link href="/" className="secondary-button">Back to overview</Link>} /><div className="settings-grid"><section className="panel settings-card"><div className="settings-icon"><UserRound size={20} /></div><p className="eyebrow">ACCOUNT</p><h2>{auth.user?.name || "Athlete"}</h2><p className="settings-email">{auth.user?.email || "Manus account"}</p><div className="settings-rule" /><div className="settings-row"><span>Login provider</span><strong>{auth.user?.loginMethod || "Manus OAuth"}</strong></div><div className="settings-row"><span>Member since</span><strong>{auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}</strong></div></section><section className="panel settings-card"><div className="settings-icon green"><ShieldCheck size={20} /></div><p className="eyebrow">PRIVACY</p><h2>Your data is yours.</h2><p className="settings-copy">Every split, custom exercise, workout, and progression cue is stored against your account. Other athletes cannot read it.</p><div className="settings-rule" /><button className="danger-button" onClick={() => auth.logout()}><LogOut size={16} /> Log out</button></section></div></>;
}
