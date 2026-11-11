import { useState } from "react";
import { Archive, ChevronRight, Copy, FastForward, Pencil, Play, Plus, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader } from "@/components/AppShell";

export default function Programs() {
  const utils = trpc.useUtils();
  const blocks = trpc.blocks.list.useQuery();
  const splits = trpc.splits.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("Strength foundation");
  const [goal, setGoal] = useState("Build consistent strength");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [notes, setNotes] = useState("");
  const create = trpc.blocks.create.useMutation({ onSuccess: () => { utils.blocks.list.invalidate(); setShowCreate(false); } });
  const refresh = () => utils.blocks.list.invalidate();
  const createBlock = (event: React.FormEvent) => { event.preventDefault(); if (name.trim()) create.mutate({ name: name.trim(), goal: goal.trim(), durationWeeks: Number(durationWeeks), notes: notes.trim() || undefined }); };
  if (blocks.isLoading || splits.isLoading) return <div className="loading-panel"><div className="pulse-dot" />Loading your programs…</div>;
  const rows = blocks.data || [];
  const splitRows = splits.data || [];
  return <>
    <PageHeader eyebrow="TRAINING ROOM / PROGRAMS" title="Build the whole block." description="Plan 1–12 weeks, assign a split to each week, and keep completed sessions tied to the prescription that created them." action={<button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> New program</button>} />
    {showCreate && <div className="modal-backdrop"><form className="modal-card" onSubmit={createBlock}><div className="modal-heading"><div><p className="eyebrow">PROGRAM BUILDER</p><h2>Create a training block</h2></div><button type="button" className="close-button" onClick={() => setShowCreate(false)}>×</button></div><label>Program name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Spring strength block" /></label><label>Primary goal<input value={goal} onChange={event => setGoal(event.target.value)} placeholder="Build strength" /></label><label>Duration <select value={durationWeeks} onChange={event => setDurationWeeks(event.target.value)}>{Array.from({ length: 9 }, (_, index) => <option key={index + 4} value={index + 4}>{index + 4} weeks</option>)}</select></label><label>Notes<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} placeholder="What should this block make possible?" /></label><button className="primary-button" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create program"}</button></form></div>}
    {rows.length === 0 ? <EmptyState title="Your program calendar is open" copy="Create a 1–12 week block, then assign a split and a progression intent to each week." action={<button className="secondary-button" onClick={() => setShowCreate(true)}>Create a program</button>} /> : <div className="program-stack">{rows.map(block => <ProgramCard key={block.id} block={block} splits={splitRows} onRefresh={refresh} />)}</div>}
  </>;
}

function ProgramCard({ block, splits, onRefresh }: { block: any; splits: any[]; onRefresh: () => void }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [duplicateName, setDuplicateName] = useState(`${block.name} copy`);
  const update = trpc.blocks.update.useMutation({ onSuccess: () => { setEditing(false); onRefresh(); } });
  const updateWeek = trpc.blocks.updateWeek.useMutation({ onSuccess: onRefresh });
  const activate = trpc.blocks.activate.useMutation({ onSuccess: onRefresh });
  const archive = trpc.blocks.archive.useMutation({ onSuccess: onRefresh });
  const advance = trpc.blocks.advance.useMutation({ onSuccess: onRefresh });
  const restart = trpc.blocks.restart.useMutation({ onSuccess: onRefresh });
  const duplicate = trpc.blocks.duplicate.useMutation({ onSuccess: () => { setDuplicateName(`${block.name} copy`); onRefresh(); } });
  const current = block.weeks.find((week: any) => week.weekNumber === block.currentWeek);
  return <article className="panel program-card"><div className="program-card-head"><div><p className="eyebrow">{block.status.toUpperCase()} / {block.durationWeeks} WEEKS</p>{editing ? <div className="program-edit-row"><input defaultValue={block.name} id={`program-name-${block.id}`} /><input defaultValue={block.goal} id={`program-goal-${block.id}`} /></div> : <><h2>{block.name}</h2><p>{block.goal} · {block.notes || "No notes yet."}</p></>}</div><div className="program-actions">{editing ? <button className="small-button" onClick={() => { const name = (document.getElementById(`program-name-${block.id}`) as HTMLInputElement).value; const goal = (document.getElementById(`program-goal-${block.id}`) as HTMLInputElement).value; update.mutate({ id: block.id, name, goal }); }}>Save</button> : <button className="icon-link" onClick={() => setEditing(true)} aria-label="Edit program"><Pencil size={15} /></button>}{block.status !== "archived" && <button className="danger-link" onClick={() => archive.mutate({ id: block.id })}><Archive size={14} /> Archive</button>}</div></div><div className="program-meta"><span>Current week <strong>{block.currentWeek} / {block.durationWeeks}</strong></span><span>Status <strong>{block.status}</strong></span><span>Current prescription <strong>{current?.splitId ? "Split assigned" : "Open setup"}</strong></span></div><div className="program-weeks">{block.weeks.map((week: any) => <WeekRow key={week.id} week={week} splits={splits} current={week.weekNumber === block.currentWeek} onSave={(values) => updateWeek.mutate({ id: week.id, ...values })} />)}</div><div className="program-footer"><div className="program-primary-actions">{current && <Link className="primary-button" href={`/workout/new?blockWeek=${current.id}`}><Play size={15} /> Start current week</Link>}{block.status !== "active" && block.status !== "archived" && <button className="secondary-button" onClick={() => activate.mutate({ id: block.id })}>Activate</button>}{block.status === "active" && block.currentWeek < block.durationWeeks && <button className="secondary-button" onClick={() => advance.mutate({ id: block.id })}><FastForward size={15} /> Advance week</button>}{block.status === "completed" && <button className="secondary-button" onClick={() => restart.mutate({ id: block.id })}><RotateCcw size={15} /> Restart</button>}</div><div className="program-copy"><input value={duplicateName} onChange={event => setDuplicateName(event.target.value)} aria-label="Duplicate program name" /><button className="secondary-button" onClick={() => duplicate.mutate({ id: block.id, name: duplicateName.trim() || `${block.name} copy` })}><Copy size={14} /> Duplicate</button></div></div></article>;
}

function WeekRow({ week, splits, current, onSave }: { week: any; splits: any[]; current: boolean; onSave: (values: { label: string; intent: string; deload: boolean; volumeMultiplier: number; splitId: number | null }) => void }) {
  const [label, setLabel] = useState(week.label);
  const [intent, setIntent] = useState(week.intent || "");
  const [deload, setDeload] = useState(Boolean(week.deload));
  const [volume, setVolume] = useState(String((week.volumeMultiplierTenth / 10).toFixed(1)));
  const [splitId, setSplitId] = useState(week.splitId ? String(week.splitId) : "");
  return <div className={`program-week ${current ? "current" : ""}`}><div className="program-week-number"><span>W{week.weekNumber}</span>{current && <em>NOW</em>}</div><label>Label<input value={label} onChange={event => setLabel(event.target.value)} /></label><label>Intent<input value={intent} onChange={event => setIntent(event.target.value)} placeholder="Build volume" /></label><label>Split<select value={splitId} onChange={event => setSplitId(event.target.value)}><option value="">Unassigned</option>{splits.map(split => <option key={split.id} value={split.id}>{split.name}</option>)}</select></label><label>Volume<input inputMode="decimal" value={volume} onChange={event => setVolume(event.target.value)} /></label><label className="deload-toggle"><input type="checkbox" checked={deload} onChange={event => setDeload(event.target.checked)} /> Deload</label><button className="small-button" onClick={() => onSave({ label, intent, deload, volumeMultiplier: Number(volume) || 1, splitId: splitId ? Number(splitId) : null })}>Save week</button>{current && <Link className="program-week-link" href={`/workout/new?blockWeek=${week.id}`}><ChevronRight size={14} /></Link>}</div>;
}
