import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, Plus, Timer } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/AppShell";

function SetRow({ set, index }: { set: any; index: number }) {
  const effort = set.rpeTenth ? `RPE ${(set.rpeTenth / 10).toFixed(1)}` : set.rirTenth != null ? `${(set.rirTenth / 10).toFixed(1)} RIR` : "Completed";
  return <div className="logged-set"><span>{index + 1}</span><strong>{(set.weightTenth / 10).toFixed(set.weightTenth % 10 ? 1 : 0)} kg</strong><strong>{set.reps} reps</strong><small>{effort}</small><Check size={15} />
  </div>;
}

function ExerciseLogger({ item, workoutId, onLogged, readOnly = false }: { item: any; workoutId: number; onLogged: () => void; readOnly?: boolean }) {
  const [weight, setWeight] = useState(item.sets.at(-1)?.weightTenth ? String(item.sets.at(-1).weightTenth / 10) : "");
  const [reps, setReps] = useState(item.sets.at(-1)?.reps ? String(item.sets.at(-1).reps) : "");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [expanded, setExpanded] = useState(true);
  const logSet = trpc.workouts.logSet.useMutation({ onSuccess: () => { onLogged(); setWeight(weight); setReps(""); setRpe(""); setRir(""); } });
  const targetEffort = item.targetRpeTenth ? `RPE ${(item.targetRpeTenth / 10).toFixed(1)}` : item.targetRirTenth != null ? `${(item.targetRirTenth / 10).toFixed(1)} RIR` : "self-regulated effort";
  return <article className="panel exercise-log-card"><button className="exercise-log-head" onClick={() => setExpanded(!expanded)}><span className="exercise-index">{String(item.orderIndex + 1).padStart(2, "0")}</span><span><strong>{item.exercise.name}</strong><small>{item.exercise.muscleGroup} · Target {item.targetSets} × {item.targetReps} · {targetEffort}</small></span><span className="set-progress">{item.sets.length}/{item.targetSets}<ChevronDown size={17} className={expanded ? "rotated" : ""} /></span></button>{expanded && <div className="exercise-log-body">{item.sets.map((set: any, index: number) => <SetRow key={set.id} set={set} index={index} />)}{!readOnly && <div className="set-entry"><label>Load<input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" /></label><label>Reps<input inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="0" /></label><label>RPE<input inputMode="decimal" value={rpe} onChange={e => setRpe(e.target.value)} placeholder="0–10" /></label><label>RIR<input inputMode="decimal" value={rir} onChange={e => setRir(e.target.value)} placeholder="0–6" /></label><button className="primary-button set-button" disabled={!weight || !reps || logSet.isPending} onClick={() => logSet.mutate({ workoutId, workoutExerciseId: item.id, weight: Number(weight), reps: Number(reps), rpe: rpe ? Number(rpe) : undefined, rir: rir ? Number(rir) : undefined })}><Plus size={16} /> Add set</button></div>}</div>}</article>;
}

export default function WorkoutLog({ readOnly = false }: { readOnly?: boolean }) {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const workoutId = Number(params.id);
  const utils = trpc.useUtils();
  const workout = trpc.workouts.get.useQuery({ id: workoutId });
  const complete = trpc.workouts.complete.useMutation({ onSuccess: () => { utils.workouts.get.invalidate({ id: workoutId }); utils.workouts.history.invalidate(); utils.dashboard.summary.invalidate(); utils.recommendations.list.invalidate(); navigate(`/history/${workoutId}`); } });
  if (workout.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading your session…</div>;
  if (!workout.data) return <div className="error-panel">This workout could not be found.</div>;
  const data = workout.data;
  const totalSets = data.exercises.reduce((sum: number, item: any) => sum + item.sets.length, 0);
  return <>
    <PageHeader eyebrow={`WORKOUT / ${data.status === "completed" ? "COMPLETED" : "IN PROGRESS"}`} title={data.name} description={`${data.exercises.length} movements · ${totalSets} sets logged`} action={<Link href={readOnly ? "/history" : "/"} className="secondary-button"><ArrowLeft size={15} /> {readOnly ? "Back to history" : "Save & exit"}</Link>} />
    <div className="workout-meta"><span><Timer size={15} /> Started {new Date(data.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span><Check size={15} /> {totalSets} completed sets</span>{data.status === "in_progress" && <span className="meta-live">IN PROGRESS</span>}</div>
    <div className="workout-layout"><div className="workout-exercises">{data.exercises.length ? data.exercises.map((item: any) => <ExerciseLogger key={item.id} item={item} workoutId={workoutId} readOnly={readOnly} onLogged={() => utils.workouts.get.invalidate({ id: workoutId })} />) : <div className="panel empty-state"><div className="empty-icon"><Plus size={22} /></div><h3>This session is open</h3><p>Start from a split day to bring prescribed exercises into the logger.</p></div>}</div><aside className="workout-aside"><div className="panel finish-card"><p className="eyebrow">SESSION SIGNAL</p><h3>{totalSets ? "Nice work. Keep the entries clean." : "Your first set is the only hard one."}</h3><p>Log load, reps, and effort. The next recommendation will use this history.</p>{!readOnly && data.status === "in_progress" && <button className="primary-button finish-button" onClick={() => complete.mutate({ workoutId })} disabled={complete.isPending}><Check size={17} /> {complete.isPending ? "Completing…" : "Complete workout"}</button>}{data.status === "completed" && <div className="completed-stamp"><Check size={17} /> Completed {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : ""}</div>}</div><div className="panel training-note"><p className="eyebrow">FORM NOTE</p><textarea readOnly={readOnly} placeholder="Add a note about today's session…" rows={4} /></div></aside></div>
  </>;
}
