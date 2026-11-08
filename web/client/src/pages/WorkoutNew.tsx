import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Dumbbell, Play } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/AppShell";

export default function WorkoutNew() {
  const [, navigate] = useLocation();
  const splits = trpc.splits.list.useQuery();
  const [selectedDay, setSelectedDay] = useState<number | undefined>(() => {
    const raw = new URLSearchParams(window.location.search).get("day");
    return raw ? Number(raw) : undefined;
  });
  const start = trpc.workouts.start.useMutation({ onSuccess: id => navigate(`/workout/${id}`) });
  const days = useMemo(() => (splits.data || []).flatMap(split => split.days.map(day => ({ ...day, splitName: split.name }))), [splits.data]);
  const chosen = days.find(day => day.id === selectedDay) || days[0];
  if (splits.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading training maps…</div>;
  return <>
    <PageHeader eyebrow="TRAINING ROOM / START" title="Choose your work." description="Start from a mapped day or open a blank session and make it yours." action={<Link href="/" className="secondary-button"><ArrowLeft size={15} /> Back to overview</Link>} />
    <div className="start-layout"><section className="panel start-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR DAYS</p><h2>{days.length ? "Pick a focus" : "Open session"}</h2></div></div>{days.length ? <div className="day-picker">{days.map(day => <button className={`day-picker-row ${chosen?.id === day.id ? "selected" : ""}`} key={day.id} onClick={() => setSelectedDay(day.id)}><span className="day-marker">{String(day.dayOrder + 1).padStart(2, "0")}</span><span><strong>{day.name}</strong><small>{day.splitName} · {day.focus}</small></span><span className="radio-dot" /></button>)}</div> : <div className="soft-empty"><Dumbbell size={22} /><p>Create a split first, or start an open workout to log anything.</p></div>}<button className="primary-button start-button" onClick={() => start.mutate({ splitDayId: chosen?.id, name: chosen?.name })} disabled={start.isPending}>{start.isPending ? "Opening session…" : <><Play size={17} fill="currentColor" /> Start {chosen?.name || "open workout"}</>}</button></section><aside className="start-note"><p className="eyebrow">A GOOD SESSION IS SIMPLE</p><h3>Pick a day.<br />Log the work.<br /><em>Leave a signal.</em></h3><p>You can add sets as you go, then complete the session when the work is done.</p><Link href="/splits" className="text-link">Edit your splits <ChevronRight size={15} /></Link></aside></div>
  </>;
}
