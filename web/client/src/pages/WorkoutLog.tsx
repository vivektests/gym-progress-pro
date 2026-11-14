import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, Pencil, Plus, Save, Timer, Trash2, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/AppShell";

function SetRow({ set, index, workoutId, readOnly, onChanged }: { set: any; index: number; workoutId: number; readOnly: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(String(set.weightTenth / 10));
  const [reps, setReps] = useState(String(set.reps));
  const [rpe, setRpe] = useState(set.rpeTenth != null ? String(set.rpeTenth / 10) : "");
  const [rir, setRir] = useState(set.rirTenth != null ? String(set.rirTenth / 10) : "");
  const update = trpc.workouts.updateSet.useMutation({ onSuccess: () => { setEditing(false); onChanged(); } });
  const remove = trpc.workouts.deleteSet.useMutation({ onSuccess: onChanged });
  const effort = set.rpeTenth != null ? `RPE ${(set.rpeTenth / 10).toFixed(1)}` : set.rirTenth != null ? `${(set.rirTenth / 10).toFixed(1)} RIR` : "Completed";
  if (editing && !readOnly) return <div className="logged-set edit-set-row"><span>{index + 1}</span><input value={weight} onChange={e => setWeight(e.target.value)} aria-label="Set weight" /><input value={reps} onChange={e => setReps(e.target.value)} aria-label="Set reps" /><input value={rpe} onChange={e => setRpe(e.target.value)} placeholder="RPE" aria-label="Set RPE" /><input value={rir} onChange={e => setRir(e.target.value)} placeholder="RIR" aria-label="Set RIR" /><button className="icon-link" onClick={() => { if (!(rpe && rir)) update.mutate({ id: set.id, workoutId, weight: Number(weight), reps: Number(reps), rpe: rpe ? Number(rpe) : undefined, rir: rir ? Number(rir) : undefined }); }} aria-label="Save set"><Save size={14} /></button></div>;
  return <div className="logged-set"><span>{index + 1}</span><strong>{(set.weightTenth / 10).toFixed(set.weightTenth % 10 ? 1 : 0)} kg</strong><strong>{set.reps} reps</strong><small>{effort}</small>{!readOnly ? <span className="set-actions"><button className="icon-link" onClick={() => setEditing(true)} aria-label="Edit set"><Pencil size={13} /></button><button className="icon-link danger-icon" onClick={() => remove.mutate({ workoutId, setId: set.id })} aria-label="Delete set"><Trash2 size={13} /></button></span> : <Check size={15} />}</div>;
}

function PrescriptionEditor({ item, workoutId, onChanged }: { item: any; workoutId: number; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(String(item.targetSets));
  const [reps, setReps] = useState(item.targetReps);
  const [rpe, setRpe] = useState(item.targetRpeTenth ? String(item.targetRpeTenth / 10) : "");
  const [rir, setRir] = useState(item.targetRirTenth != null ? String(item.targetRirTenth / 10) : "");
  const [increment, setIncrement] = useState(String(item.loadIncrementTenth / 10));
  const [strategy, setStrategy] = useState(item.progressionStrategy);
  const update = trpc.workouts.updateExercise.useMutation({ onSuccess: () => { setEditing(false); onChanged(); } });
  const remove = trpc.workouts.deleteExercise.useMutation({ onSuccess: onChanged });
  const range = reps.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  if (editing) return <div className="workout-prescription-edit"><input value={sets} onChange={e => setSets(e.target.value)} aria-label="Workout target sets" /><input value={reps} onChange={e => setReps(e.target.value)} aria-label="Workout target reps" /><input value={rpe} onChange={e => setRpe(e.target.value)} placeholder="RPE" aria-label="Workout target RPE" /><input value={rir} onChange={e => setRir(e.target.value)} placeholder="RIR" aria-label="Workout target RIR" /><input value={increment} onChange={e => setIncrement(e.target.value)} placeholder="kg" aria-label="Workout load increment" /><select value={strategy} onChange={e => setStrategy(e.target.value)}><option value="double_progression">Double progression</option><option value="rpe_autoregulation">RPE autoregulation</option><option value="fixed_load">Fixed load</option></select><button className="icon-link" onClick={() => { if (range && !(rpe && rir)) update.mutate({ id: item.id, workoutId, targetSets: Number(sets), targetReps: reps, repMin: Number(range[1]), repMax: Number(range[2]), targetRpe: rpe ? Number(rpe) : undefined, targetRir: rir ? Number(rir) : undefined, loadIncrement: Number(increment), progressionStrategy: strategy, restSeconds: item.restSeconds }); }} aria-label="Save workout prescription"><Save size={14} /></button></div>;
  return <div className="workout-prescription-actions"><small>{item.exercise.muscleGroup} · Target {item.targetSets} × {item.targetReps}</small><button className="icon-link" onClick={() => setEditing(true)} aria-label="Edit workout prescription"><Pencil size={13} /></button><button className="icon-link danger-icon" onClick={() => remove.mutate({ workoutId, workoutExerciseId: item.id })} aria-label="Delete workout exercise"><Trash2 size={13} /></button></div>;
}

function ExerciseLogger({ item, workoutId, onLogged, readOnly = false }: { item: any; workoutId: number; onLogged: () => void; readOnly?: boolean }) {
  const [weight, setWeight] = useState(item.sets.at(-1)?.weightTenth ? String(item.sets.at(-1).weightTenth / 10) : "");
  const [reps, setReps] = useState(item.sets.at(-1)?.reps ? String(item.sets.at(-1).reps) : "");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [expanded, setExpanded] = useState(true);
  const logSet = trpc.workouts.logSet.useMutation({ onSuccess: () => { onLogged(); setReps(""); setRpe(""); setRir(""); } });
  const targetEffort = item.targetRpeTenth ? `RPE ${(item.targetRpeTenth / 10).toFixed(1)}` : item.targetRirTenth != null ? `${(item.targetRirTenth / 10).toFixed(1)} RIR` : "self-regulated effort";
  const effortConflict = Boolean(rpe && rir);
  return <article className="panel exercise-log-card"><button className="exercise-log-head" onClick={() => setExpanded(!expanded)}><span className="exercise-index">{String(item.orderIndex + 1).padStart(2, "0")}</span><span><strong>{item.exercise.name}</strong><small>{targetEffort}</small></span><span className="set-progress">{item.sets.length}/{item.targetSets}<ChevronDown size={17} className={expanded ? "rotated" : ""} /></span></button>{expanded && <div className="exercise-log-body"><PrescriptionEditor item={item} workoutId={workoutId} onChanged={onLogged} />{item.sets.map((set: any, index: number) => <SetRow key={set.id} set={set} index={index} workoutId={workoutId} readOnly={readOnly} onChanged={onLogged} />)}{!readOnly && <div className="set-entry"><label>Load<input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" /></label><label>Reps<input inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="0" /></label><label>RPE<input inputMode="decimal" value={rpe} onChange={e => setRpe(e.target.value)} placeholder="0–10" /></label><label>RIR<input inputMode="decimal" value={rir} onChange={e => setRir(e.target.value)} placeholder="0–6" /></label><button className="primary-button set-button" disabled={!weight || !reps || logSet.isPending || effortConflict} onClick={() => logSet.mutate({ workoutId, workoutExerciseId: item.id, weight: Number(weight), reps: Number(reps), rpe: rpe ? Number(rpe) : undefined, rir: rir ? Number(rir) : undefined })}><Plus size={16} /> Add set</button>{effortConflict && <small className="effort-validation">Choose RPE or RIR, not both.</small>}</div>}</div>}</article>;
}

export default function WorkoutLog({ readOnly = false }: { readOnly?: boolean }) {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const workoutId = Number(params.id);
  const utils = trpc.useUtils();
  const workout = trpc.workouts.get.useQuery({ id: workoutId });
  const exercises = trpc.exercises.list.useQuery({});
  const [editingHeader, setEditingHeader] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const update = trpc.workouts.update.useMutation({ onSuccess: () => { setEditingHeader(false); utils.workouts.get.invalidate({ id: workoutId }); } });
  const remove = trpc.workouts.delete.useMutation({ onSuccess: () => navigate("/") });
  const addExercise = trpc.workouts.addExercise.useMutation({ onSuccess: () => { setShowAdd(false); utils.workouts.get.invalidate({ id: workoutId }); } });
  const complete = trpc.workouts.complete.useMutation({ onSuccess: () => { utils.workouts.get.invalidate({ id: workoutId }); utils.workouts.history.invalidate(); utils.dashboard.summary.invalidate(); utils.recommendations.list.invalidate(); navigate(`/history/${workoutId}`); } });
  if (workout.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading your session…</div>;
  if (!workout.data) return <div className="error-panel">This workout could not be found.</div>;
  const data = workout.data;
  const mutable = !readOnly && data.status === "in_progress";
  const totalSets = data.exercises.reduce((sum: number, item: any) => sum + item.sets.length, 0);
  return <>
    <PageHeader eyebrow={`WORKOUT / ${data.status === "completed" ? "COMPLETED" : "IN PROGRESS"}`} title={editingHeader ? <input className="workout-title-input" value={name || data.name} onChange={e => setName(e.target.value)} /> : data.name} description={`${data.exercises.length} movements · ${totalSets} sets logged`} action={<div className="page-actions"><Link href={readOnly ? "/history" : "/"} className="secondary-button"><ArrowLeft size={15} /> {readOnly ? "Back to history" : "Save & exit"}</Link>{mutable && !editingHeader && <button className="secondary-button" onClick={() => { setName(data.name); setNotes(data.notes || ""); setEditingHeader(true); }}><Pencil size={14} /> Edit session</button>}{editingHeader && <button className="small-button" onClick={() => update.mutate({ id: workoutId, name: name.trim(), notes })}><Save size={14} /> Save</button>}{mutable && <button className="danger-link" onClick={() => remove.mutate({ id: workoutId })}><Trash2 size={14} /> Delete workout</button>}</div>} />
    {editingHeader && <div className="workout-header-edit"><label>Session notes<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></label><button className="icon-link" onClick={() => setEditingHeader(false)} aria-label="Cancel session edit"><X size={16} /></button></div>}
    <div className="workout-meta"><span><Timer size={15} /> Started {new Date(data.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span><Check size={15} /> {totalSets} completed sets</span>{mutable && <span className="meta-live">IN PROGRESS</span>}</div>
    <div className="workout-layout"><div className="workout-exercises">{data.exercises.length ? data.exercises.map((item: any) => <ExerciseLogger key={item.id} item={item} workoutId={workoutId} readOnly={!mutable} onLogged={() => utils.workouts.get.invalidate({ id: workoutId })} />) : <div className="panel empty-state"><div className="empty-icon"><Plus size={22} /></div><h3>This session is open</h3><p>Add a movement below to begin logging.</p></div>}{mutable && <button className="secondary-button add-workout-exercise" onClick={() => setShowAdd(!showAdd)}><Plus size={15} /> Add movement</button>}{showAdd && mutable && <div className="panel add-workout-form"><select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}><option value="">Choose an exercise</option>{(exercises.data || []).map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select><button className="small-button" disabled={!selectedExercise} onClick={() => addExercise.mutate({ workoutId, exerciseId: Number(selectedExercise), targetSets: 3, targetReps: "8-12", repMin: 8, repMax: 12, loadIncrement: 2.5, progressionStrategy: "double_progression", restSeconds: 90 })}><Plus size={14} /> Add</button></div>}</div><aside className="workout-aside"><div className="panel finish-card"><p className="eyebrow">SESSION SIGNAL</p><h3>{totalSets ? "Nice work. Keep the entries clean." : "Your first set is the only hard one."}</h3><p>Log load, reps, and effort. The next recommendation will use this history.</p>{mutable && <button className="primary-button finish-button" onClick={() => complete.mutate({ workoutId, notes: notes || undefined })} disabled={complete.isPending}><Check size={17} /> {complete.isPending ? "Completing…" : "Complete workout"}</button>}{data.status === "completed" && <div className="completed-stamp"><Check size={17} /> Completed {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : ""}</div>}</div>{!editingHeader && <div className="panel training-note"><p className="eyebrow">FORM NOTE</p><textarea readOnly={!mutable} value={notes || data.notes || ""} onChange={e => setNotes(e.target.value)} placeholder="Add a note about today's session…" rows={4} /></div>}</aside></div>
  </>;
}
