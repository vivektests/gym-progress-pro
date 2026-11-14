import { useState } from "react";
import { ChevronDown, ChevronRight, Dumbbell, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader } from "@/components/AppShell";

export default function Splits() {
  const utils = trpc.useUtils();
  const splits = trpc.splits.list.useQuery();
  const exercises = trpc.exercises.list.useQuery({});
  const [showCreate, setShowCreate] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [name, setName] = useState("Upper / Lower");
  const [description, setDescription] = useState("A simple four-day rhythm for steady progress.");
  const [days, setDays] = useState("Upper A|Chest + back\nLower A|Quads + hamstrings\nUpper B|Shoulders + arms\nLower B|Posterior chain");
  const [exerciseName, setExerciseName] = useState("");
  const [muscle, setMuscle] = useState("Full body");
  const [equipment, setEquipment] = useState("Dumbbell");
  const createSplit = trpc.splits.create.useMutation({ onSuccess: () => { utils.splits.list.invalidate(); utils.dashboard.summary.invalidate(); setShowCreate(false); } });
  const deleteSplit = trpc.splits.delete.useMutation({ onSuccess: () => { utils.splits.list.invalidate(); utils.dashboard.summary.invalidate(); } });
  const createExercise = trpc.exercises.create.useMutation({ onSuccess: () => { utils.exercises.list.invalidate(); utils.dashboard.summary.invalidate(); setShowExercise(false); setExerciseName(""); } });
  const addExercise = trpc.splits.addExercise.useMutation({ onSuccess: () => utils.splits.list.invalidate() });

  if (splits.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading your splits…</div>;
  const splitRows = splits.data || [];
  const exerciseRows = exercises.data || [];
  function submitSplit(event: React.FormEvent) {
    event.preventDefault();
    const parsedDays = days.split("\n").map(line => { const [dayName, focus] = line.split("|"); return { name: dayName.trim(), focus: (focus || "Strength").trim() }; }).filter(day => day.name);
    if (!name.trim() || !parsedDays.length) return;
    createSplit.mutate({ name: name.trim(), description: description.trim(), days: parsedDays });
  }
  return <>
    <PageHeader eyebrow="TRAINING ROOM / SPLITS" title="Build your rhythm." description="Turn the way you train into a map you can return to, session after session." action={<button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> New split</button>} />
    {showCreate && <div className="modal-backdrop"><form className="modal-card" onSubmit={submitSplit}><div className="modal-heading"><div><p className="eyebrow">NEW TRAINING MAP</p><h2>Create a split</h2></div><button type="button" className="close-button" onClick={() => setShowCreate(false)}>×</button></div><label>Split name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Push / Pull / Legs" /></label><label>Short description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></label><label>Days <span className="field-hint">one per line: Name|Focus</span><textarea value={days} onChange={e => setDays(e.target.value)} rows={6} /></label><button className="primary-button" disabled={createSplit.isPending}>{createSplit.isPending ? "Saving…" : "Save split"}</button></form></div>}
    {showExercise && <div className="modal-backdrop"><form className="modal-card compact" onSubmit={e => { e.preventDefault(); if (exerciseName.trim()) createExercise.mutate({ name: exerciseName.trim(), muscleGroup: muscle, equipment }); }}><div className="modal-heading"><div><p className="eyebrow">EXERCISE LIBRARY</p><h2>Add a custom movement</h2></div><button type="button" className="close-button" onClick={() => setShowExercise(false)}>×</button></div><label>Name<input value={exerciseName} onChange={e => setExerciseName(e.target.value)} placeholder="e.g. Single-arm landmine press" /></label><div className="form-row"><label>Muscle group<input value={muscle} onChange={e => setMuscle(e.target.value)} /></label><label>Equipment<input value={equipment} onChange={e => setEquipment(e.target.value)} /></label></div><button className="primary-button" disabled={createExercise.isPending}>{createExercise.isPending ? "Adding…" : "Add movement"}</button></form></div>}
    <div className="section-toolbar"><div><span className="count-badge">{splitRows.length}</span> saved split{splitRows.length === 1 ? "" : "s"}</div><button className="secondary-button" onClick={() => setShowExercise(true)}><Dumbbell size={15} /> Add custom exercise</button></div>
    {splitRows.length === 0 ? <EmptyState title="Your training map is blank" copy="Create your first split to organize days, focus areas, and the work you want to repeat." action={<button className="secondary-button" onClick={() => setShowCreate(true)}>Create a split</button>} /> : <div className="split-stack">{splitRows.map(split => <SplitCard key={split.id} split={split} exercises={exerciseRows} onRefresh={() => utils.splits.list.invalidate()} onDelete={() => deleteSplit.mutate({ id: split.id })} onAdd={input => addExercise.mutate({ splitDayId: input.splitDayId, ...input.values })} />)}</div>}
  </>;
}

function SplitCard({ split, exercises, onRefresh, onDelete, onAdd }: { split: any; exercises: any[]; onRefresh: () => void; onDelete: () => void; onAdd: (input: { splitDayId: number; values: any }) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(split.name);
  const [description, setDescription] = useState(split.description || "");
  const update = trpc.splits.update.useMutation({ onSuccess: () => { setEditing(false); onRefresh(); } });
  return <article className="panel split-card"><div className="split-card-head"><div>{editing ? <div className="split-edit-fields"><input value={name} onChange={e => setName(e.target.value)} /><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div> : <><p className="eyebrow">SPLIT / {String(split.id).padStart(2, "0")}</p><h2>{split.name}</h2><p>{split.description}</p></>}</div><div className="split-card-actions">{editing ? <button className="small-button" onClick={() => update.mutate({ id: split.id, name: name.trim(), description: description.trim() })}><Save size={14} /> Save</button> : <button className="icon-link" onClick={() => setEditing(true)} aria-label="Edit split"><Pencil size={15} /></button>}<button className="danger-link" onClick={onDelete}><Trash2 size={15} /> Delete</button></div></div><div className="split-day-grid">{split.days.map((day: any) => <SplitDay key={day.id} day={day} exercises={exercises} onRefresh={onRefresh} onAdd={values => onAdd({ splitDayId: day.id, values })} />)}</div></article>;
}

function SplitDay({ day, exercises, onRefresh, onAdd }: { day: any; exercises: any[]; onRefresh: () => void; onAdd: (values: any) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dayName, setDayName] = useState(day.name);
  const [focus, setFocus] = useState(day.focus);
  const updateDay = trpc.splits.updateDay.useMutation({ onSuccess: () => { setEditing(false); onRefresh(); } });
  const [selected, setSelected] = useState(exercises[0]?.id?.toString() || "");
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("8-12");
  const [targetRpe, setTargetRpe] = useState("");
  const [targetRir, setTargetRir] = useState("");
  const [loadIncrement, setLoadIncrement] = useState("2.5");
  const [strategy, setStrategy] = useState<"double_progression" | "rpe_autoregulation" | "fixed_load">("double_progression");
  const range = targetReps.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  return <div className="split-day-card"><div className="split-day-title"><button onClick={() => setOpen(!open)}><span className="day-marker">{String(day.dayOrder + 1).padStart(2, "0")}</span><span><strong>{day.name}</strong><small>{day.focus}</small></span>{open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button><button className="icon-link" onClick={() => setEditing(!editing)} aria-label="Edit training day">{editing ? <X size={15} /> : <Pencil size={15} />}</button></div>{editing && <div className="day-edit-row"><input value={dayName} onChange={e => setDayName(e.target.value)} aria-label="Day name" /><input value={focus} onChange={e => setFocus(e.target.value)} aria-label="Day focus" /><button className="small-button" onClick={() => updateDay.mutate({ id: day.id, name: dayName.trim(), focus: focus.trim() })}><Save size={14} /> Save</button></div>}{open && <div className="split-day-body">{day.exercises.length ? day.exercises.map((item: any) => <PrescriptionRow key={item.id} item={item} onRefresh={onRefresh} />) : <p className="muted-copy">No exercises prescribed yet.</p>}<div className="add-prescription"><select value={selected} onChange={e => setSelected(e.target.value)}>{exercises.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className="prescription-mini-input" inputMode="numeric" value={targetSets} onChange={e => setTargetSets(e.target.value)} aria-label="Target sets" placeholder="sets" /><input className="prescription-mini-input" value={targetReps} onChange={e => setTargetReps(e.target.value)} aria-label="Target rep range" placeholder="8-12" /><button className="small-button" onClick={() => { if (!selected || !range) return; onAdd({ exerciseId: Number(selected), targetSets: Number(targetSets), targetReps, repMin: Number(range[1]), repMax: Number(range[2]), targetRpe: targetRpe ? Number(targetRpe) : undefined, targetRir: targetRir ? Number(targetRir) : undefined, loadIncrement: Number(loadIncrement), progressionStrategy: strategy, restSeconds: 90 }); }}><Plus size={14} /> Add</button></div><div className="prescription-options"><label>Target RPE<input inputMode="decimal" value={targetRpe} onChange={e => setTargetRpe(e.target.value)} placeholder="8" /></label><label>Target RIR<input inputMode="decimal" value={targetRir} onChange={e => setTargetRir(e.target.value)} placeholder="optional" /></label><label>Load step<input inputMode="decimal" value={loadIncrement} onChange={e => setLoadIncrement(e.target.value)} placeholder="2.5 kg" /></label><label>Strategy<select value={strategy} onChange={e => setStrategy(e.target.value as typeof strategy)}><option value="double_progression">Double progression</option><option value="rpe_autoregulation">RPE autoregulation</option><option value="fixed_load">Fixed load</option></select></label></div><Link href={`/workout/new?day=${day.id}`} className="start-day-link">Start this day <ChevronRight size={14} /></Link></div>}</div>;
}

function PrescriptionRow({ item, onRefresh }: { item: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(String(item.targetSets));
  const [reps, setReps] = useState(item.targetReps);
  const [rpe, setRpe] = useState(item.targetRpeTenth ? String(item.targetRpeTenth / 10) : "");
  const [rir, setRir] = useState(item.targetRirTenth != null ? String(item.targetRirTenth / 10) : "");
  const [increment, setIncrement] = useState(String(item.loadIncrementTenth / 10));
  const [strategy, setStrategy] = useState(item.progressionStrategy);
  const update = trpc.splits.updateExercise.useMutation({ onSuccess: () => { setEditing(false); onRefresh(); } });
  const remove = trpc.splits.deleteExercise.useMutation({ onSuccess: onRefresh });
  const range = reps.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  return editing ? <div className="prescription-edit-row"><strong>{item.exercise.name}</strong><input value={sets} onChange={e => setSets(e.target.value)} aria-label="Target sets" /><input value={reps} onChange={e => setReps(e.target.value)} aria-label="Target reps" /><input value={rpe} onChange={e => setRpe(e.target.value)} placeholder="RPE" aria-label="Target RPE" /><input value={rir} onChange={e => setRir(e.target.value)} placeholder="RIR" aria-label="Target RIR" /><input value={increment} onChange={e => setIncrement(e.target.value)} placeholder="kg" aria-label="Load increment" /><select value={strategy} onChange={e => setStrategy(e.target.value)}><option value="double_progression">Double progression</option><option value="rpe_autoregulation">RPE autoregulation</option><option value="fixed_load">Fixed load</option></select><button className="icon-link" onClick={() => { if (range) update.mutate({ id: item.id, targetSets: Number(sets), targetReps: reps, repMin: Number(range[1]), repMax: Number(range[2]), targetRpe: rpe ? Number(rpe) : undefined, targetRir: rir ? Number(rir) : undefined, loadIncrement: Number(increment), progressionStrategy: strategy, restSeconds: item.restSeconds }); }} aria-label="Save prescription"><Save size={14} /></button></div> : <div className="prescription-row"><span>{item.exercise.name}</span><small>{item.targetSets} × {item.targetReps}{item.targetRpeTenth ? ` · RPE ${(item.targetRpeTenth / 10).toFixed(1)}` : item.targetRirTenth != null ? ` · ${(item.targetRirTenth / 10).toFixed(1)} RIR` : ""}</small><button className="icon-link" onClick={() => setEditing(true)} aria-label="Edit prescription"><Pencil size={13} /></button><button className="icon-link danger-icon" onClick={() => remove.mutate({ id: item.id })} aria-label="Delete prescription"><Trash2 size={13} /></button></div>;
}
