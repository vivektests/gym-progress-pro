import { Activity, ArrowUpRight, BatteryCharging, CalendarDays, Flame, Info, Trophy } from "lucide-react";
import { Link } from "wouter";
import { MUSCLE_GROUPS } from "@shared/analytics";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader } from "@/components/AppShell";

function formatDay(date: string | null) {
  if (!date) return "Not trained yet";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function heatClass(intensity: number) {
  return intensity === 0 ? "heat-0" : `heat-${Math.min(4, intensity)}`;
}

export default function Analytics() {
  const analytics = trpc.analytics.summary.useQuery();
  if (analytics.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Assembling your analytics…</div>;
  if (analytics.isError || !analytics.data) return <div className="error-panel">We couldn’t load analytics yet. Complete a workout and try again.</div>;
  const { heatmap, recovery, milestones, days } = analytics.data;
  const cells = new Map(heatmap.map(item => [`${item.muscle}:${item.date}`, item]));
  const activeDays = new Set(heatmap.filter(item => item.intensity > 0).map(item => item.date)).size;
  const totalSets = recovery.reduce((sum, item) => sum + item.weeklySets, 0);
  const readyCount = recovery.filter(item => item.tone === "ready").length;

  return <>
    <PageHeader eyebrow="TRAINING ROOM / ANALYTICS" title="Read the signal." description="See where your training stress is landing, how much recovery you have, and which milestones are closest." action={<Link href="/progress" className="secondary-button">Open progress charts <ArrowUpRight size={15} /></Link>} />

    <div className="analytics-kpis"><div className="analytics-kpi"><div className="analytics-kpi-icon orange"><Activity size={17} /></div><span>Training days</span><strong>{activeDays}<small>/ 28</small></strong><em>Rolling window</em></div><div className="analytics-kpi"><div className="analytics-kpi-icon blue"><BatteryCharging size={17} /></div><span>Muscles ready</span><strong>{readyCount}<small>/ {MUSCLE_GROUPS.length}</small></strong><em>Good to train today</em></div><div className="analytics-kpi"><div className="analytics-kpi-icon violet"><Flame size={17} /></div><span>Tracked sets</span><strong>{totalSets}</strong><em>Last 28 days</em></div><div className="analytics-kpi"><div className="analytics-kpi-icon green"><Trophy size={17} /></div><span>PR milestones</span><strong>{milestones.length}</strong><em>Exercises with signal</em></div></div>

    <section className="panel recovery-panel"><div className="panel-heading"><div><p className="eyebrow">RECOVERY MAP / LAST 28 DAYS</p><h2>Muscle stress heatmap</h2></div><div className="heatmap-legend"><span>LOW</span><i className="heat-0" /><i className="heat-1" /><i className="heat-2" /><i className="heat-3" /><i className="heat-4" /><span>HIGH</span></div></div><div className="heatmap-wrap"><div className="heatmap-label-spacer" /><div className="heatmap-days">{days.map((day, index) => <span key={day} className={index % 7 === 0 || index === days.length - 1 ? "show-day" : ""}>{index % 7 === 0 || index === days.length - 1 ? new Date(day).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }) : ""}</span>)}</div>{MUSCLE_GROUPS.map(muscle => <div className="heatmap-row" key={muscle}><strong>{muscle}</strong><div className="heatmap-cells">{days.map(day => { const cell = cells.get(`${muscle}:${day}`); return <span key={day} className={`heat-cell ${heatClass(cell?.intensity || 0)}`} title={`${muscle} · ${day} · ${cell?.sets || 0} sets`} />; })}</div></div>)}</div><div className="heatmap-footnote"><Info size={14} /> Each cell is completed-set stress. Darker means more work landed on that muscle that day.</div></section>

    <div className="analytics-two-col"><section className="panel readiness-panel"><div className="panel-heading"><div><p className="eyebrow">RECOVERY CHECK</p><h2>Readiness by muscle</h2></div><span className="signal">LIVE</span></div><div className="readiness-list">{recovery.map(item => <div className="readiness-row" key={item.muscle}><div className={`readiness-badge ${item.tone}`}><span>{item.score}</span></div><div className="readiness-info"><strong>{item.muscle}</strong><span>{item.weeklySets} sets in window · Last trained {formatDay(item.lastTrained)}</span></div><div className={`readiness-label ${item.tone}`}>{item.label}</div></div>)}</div></section><section className="panel insight-panel"><p className="eyebrow">COACH'S READ</p><h2>{readyCount >= 5 ? "Your week has room for a strong session." : readyCount >= 2 ? "A few areas are ready to move." : "Give the signal time to clear."}</h2><p>{readyCount >= 5 ? "Most muscle groups are recovered. Use the split map to choose a focused day and keep your volume intentional." : "Use the heatmap and readiness scores together. A dark cell is a training signal, not a reason to chase fatigue."}</p><Link href="/workout/new" className="primary-button">Choose next session <ArrowUpRight size={15} /></Link></section></div>

    <section className="milestones-section"><div className="section-heading"><div><p className="eyebrow">PROGRESSION / PR MILESTONES</p><h2>Keep a marker in sight.</h2></div><span className="toolbar-note">Estimated 1RM uses the Epley formula</span></div>{milestones.length ? <div className="milestone-grid">{milestones.map(item => <article className="panel milestone-card" key={item.exerciseName}><div className="milestone-top"><div className="milestone-icon"><Trophy size={16} /></div><span className="milestone-muscle">{item.muscle}</span></div><h3>{item.exerciseName}</h3><div className="milestone-values"><div><span>Best set</span><strong>{item.bestWeight}<small> kg × {item.bestReps}</small></strong></div><div><span>Next marker</span><strong>{item.next}<small> kg</small></strong></div></div><div className="milestone-bar"><span style={{ width: `${item.percent}%` }} /></div><div className="milestone-foot"><span>{item.remaining > 0 ? `${item.remaining} kg to go` : "Marker reached"}</span><span>{item.percent}%</span></div><div className="milestone-date"><CalendarDays size={13} /> Best logged {formatDay(item.achievedAt)} · e1RM {item.bestEstimatedOneRepMax} kg</div></article>)}</div> : <div className="panel"><EmptyState title="Your first milestone is waiting" copy="Complete a workout with a loaded movement and we’ll track the next marker automatically." action={<Link href="/workout/new" className="secondary-button">Log a workout</Link>} /></div>}</section>
  </>;
}
