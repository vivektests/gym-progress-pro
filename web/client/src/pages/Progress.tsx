import { useState } from "react";
import { ArrowUpRight, BarChart3, ChevronDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader, RecommendationCard } from "@/components/AppShell";

export default function Progress() {
  const exercises = trpc.exercises.list.useQuery({});
  const [exerciseId, setExerciseId] = useState<number | undefined>();
  const selectedId = exerciseId || exercises.data?.[0]?.id;
  const series = trpc.progress.series.useQuery({ exerciseId: selectedId || 0 }, { enabled: Boolean(selectedId) });
  const recommendations = trpc.recommendations.list.useQuery();
  const selected = exercises.data?.find(item => item.id === selectedId);
  const points = series.data || [];
  const maxWeight = points.reduce((max, item) => Math.max(max, item.weight), 0);
  const firstWeight = points[0]?.weight || 0;
  const delta = firstWeight ? Math.round(((maxWeight - firstWeight) / firstWeight) * 100) : 0;
  return <>
    <PageHeader eyebrow="TRAINING ROOM / PROGRESS" title="See the signal." description="Track the lifts that matter and let the trend speak louder than a single session." action={<Link href="/history" className="secondary-button">Review history <ArrowUpRight size={15} /></Link>} />
    <div className="progress-toolbar"><div className="select-wrap"><select value={selectedId || ""} onChange={e => setExerciseId(Number(e.target.value))}>{(exercises.data || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={16} /></div><span className="toolbar-note">Showing completed sets only</span></div>
    {!selected ? <EmptyState title="Choose an exercise" copy="Your progress will appear here after you log a completed workout." /> : <><div className="progress-summary"><div className="progress-stat"><span>Best logged load</span><strong>{maxWeight || 0}<small> kg</small></strong><em><TrendingUp size={14} /> {delta >= 0 ? `${delta}% from first log` : "Build the baseline"}</em></div><div className="progress-stat"><span>Sessions with this lift</span><strong>{points.length}</strong><em>Distinct training days</em></div><div className="progress-stat"><span>Latest volume</span><strong>{points.at(-1)?.volume ? Math.round(points.at(-1)!.volume).toLocaleString() : 0}<small> kg</small></strong><em>Last completed session</em></div></div><section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">LOAD TREND / {selected.name}</p><h2>Top working weight</h2></div><div className="chart-legend"><span className="legend-dot" /> kg</div></div>{points.length > 1 ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={310}><LineChart data={points} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e1d8" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#8a8478", fontSize: 11 }} tickFormatter={value => value.slice(5)} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#8a8478", fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} /><Tooltip contentStyle={{ border: "1px solid #e6e1d8", borderRadius: 10, background: "#fffcf7", fontSize: 12 }} formatter={(value: number) => [`${value} kg`, "Top load"]} /><Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#f97316", stroke: "#fffcf7", strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div> : <div className="chart-empty"><BarChart3 size={28} /><p>Complete two sessions with {selected.name} to reveal a trend line.</p></div>}</section><section className="recommendation-section"><div className="section-heading"><div><p className="eyebrow">NEXT MOVES</p><h2>Progression cues</h2></div></div>{recommendations.data?.length ? <div className="recommendation-grid">{recommendations.data.map(item => <RecommendationCard key={item.exerciseName} exerciseName={item.exerciseName} recommendation={item.recommendation} />)}</div> : <div className="panel soft-empty"><p>Log a completed workout to generate your first cue.</p></div>}</section></>}
  </>;
}
