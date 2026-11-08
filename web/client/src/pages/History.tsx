import { useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronRight, Search } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader } from "@/components/AppShell";

export default function History() {
  const [search, setSearch] = useState("");
  const history = trpc.workouts.history.useQuery({ search: search || undefined });
  return <>
    <PageHeader eyebrow="TRAINING ROOM / HISTORY" title="Your work, kept." description="Search every completed session and revisit the details that made it count." action={<Link href="/progress" className="secondary-button">View charts <ArrowUpRight size={15} /></Link>} />
    <div className="history-tools"><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions…" /></div><span className="toolbar-note">{history.data?.length || 0} sessions</span></div>
    {history.isLoading ? <div className="loading-panel"><div className="pulse-dot" />Searching your logs…</div> : history.data?.length ? <section className="panel history-full"><div className="history-head"><span>Session</span><span>Date</span><span>Sets</span><span>Volume</span><span /></div>{history.data.map(item => <Link className="history-row" href={`/history/${item.id}`} key={item.id}><div className="history-session"><div className="session-icon"><CalendarDays size={16} /></div><strong>{item.name}</strong></div><span>{item.completedAt ? new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</span><span>{item.totalSets}</span><span>{Math.round(item.totalVolume).toLocaleString()} kg</span><ChevronRight size={16} /></Link>)}</section> : <EmptyState title={search ? "No matching sessions" : "Your history is empty"} copy={search ? "Try another session name." : "Complete a workout and it will land here."} action={<Link href="/workout/new" className="secondary-button">Start a workout</Link>} />}
  </>;
}
