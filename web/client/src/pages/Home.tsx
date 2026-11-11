import { Link } from "wouter";
import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, Flame, Plus, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader, RecommendationCard } from "@/components/AppShell";

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Home() {
  const summary = trpc.dashboard.summary.useQuery();
  if (summary.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading your training room…</div>;
  if (summary.isError || !summary.data) return <div className="error-panel">We couldn’t load your training data. Refresh to try again.</div>;
  const { stats, splits, history, recommendations, user } = summary.data;
  const activeSplit = splits[0];

  return <>
    <PageHeader eyebrow="OVERVIEW / TODAY" title={`Good to see you, ${user.name?.split(" ")[0] || "athlete"}.`} description="Your training room is ready. Keep the signal high and the next set obvious." action={<Link href="/workout/new" className="primary-button"><Plus size={17} /> Start workout</Link>} />

    <section className="hero-strip">
      <div><p className="eyebrow">THIS WEEK</p><h2>{stats.sessionsThisWeek === 0 ? "Your next session is waiting." : `${stats.sessionsThisWeek} session${stats.sessionsThisWeek === 1 ? "" : "s"} in the last 7 days.`}</h2><p>Consistency compounds. Pick a day and keep the streak moving.</p></div>
      <Link href="/progress" className="text-link">View progress <ArrowUpRight size={16} /></Link>
    </section>

    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon orange"><Flame size={18} /></div><span>Sessions this week</span><strong>{stats.sessionsThisWeek}</strong><small>{stats.totalSessions ? "Keep building" : "Start your first log"}</small></div>
      <div className="stat-card"><div className="stat-icon blue"><Trophy size={18} /></div><span>Total sessions</span><strong>{stats.totalSessions}</strong><small>Completed workouts</small></div>
      <div className="stat-card"><div className="stat-icon green"><CalendarDays size={18} /></div><span>Training splits</span><strong>{stats.splitCount}</strong><small>Plans in your room</small></div>
      <div className="stat-card"><div className="stat-icon violet"><Clock3 size={18} /></div><span>Total volume</span><strong>{Math.round(stats.totalVolume).toLocaleString()}</strong><small>kg logged</small></div>
    </div>

    <div className="content-grid two-thirds">
      <section className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR TRAINING MAP</p><h2>{activeSplit?.name || "Build your first split"}</h2></div><Link href="/splits" className="icon-link" aria-label="View splits"><ChevronRight size={19} /></Link></div>{activeSplit ? <div className="day-list">{activeSplit.days.map((day, index) => <div className="day-row" key={day.id}><div className="day-number">{String(index + 1).padStart(2, "0")}</div><div><strong>{day.name}</strong><span>{day.focus} · {day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}</span></div><Link href={`/workout/new?day=${day.id}`} className="small-button">Train <ChevronRight size={14} /></Link></div>)}</div> : <EmptyState title="No split yet" copy="Create a simple training map and make your next session easier to start." action={<Link href="/splits" className="secondary-button">Create a split</Link>} />}</section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">COACH'S NOTE</p><h2>Progress cues</h2></div><span className="signal">LIVE</span></div>{recommendations.length ? <div className="recommendation-stack">{recommendations.slice(0, 2).map(item => <RecommendationCard key={item.exerciseName} exerciseName={item.exerciseName} recommendation={item.recommendation} reason={item.reason} confidence={item.confidence} />)}</div> : <div className="soft-empty"><SparkleMark /><p>Complete a session to unlock your first progression cue.</p></div>}</section>
    </div>

    <section className="panel history-preview"><div className="panel-heading"><div><p className="eyebrow">RECENTLY COMPLETED</p><h2>History</h2></div><Link href="/history" className="text-link">All history <ArrowUpRight size={16} /></Link></div>{history.length ? <div className="history-table"><div className="history-head"><span>Session</span><span>Date</span><span>Sets</span><span>Volume</span></div>{history.map(item => <Link className="history-row" href={`/history/${item.id}`} key={item.id}><strong>{item.name}</strong><span>{formatDate(item.completedAt)}</span><span>{item.totalSets}</span><span>{Math.round(item.totalVolume).toLocaleString()} kg</span><ChevronRight size={16} /></Link>)}</div> : <EmptyState title="No completed sessions" copy="Your finished workouts will appear here." action={<Link href="/workout/new" className="secondary-button">Log your first workout</Link>} />}</section>
  </>;
}

function SparkleMark() { return <div className="soft-empty-icon">✦</div>; }
