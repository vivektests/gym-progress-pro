import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronRight, Download, FileText, Search } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { historyToCsv } from "@shared/exports";

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));
}

export default function History() {
  const [search, setSearch] = useState("");
  const history = trpc.workouts.history.useQuery({ search: search || undefined });
  const exportHistory = trpc.workouts.export.useQuery();
  const exportRows = exportHistory.data || [];
  const exportDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleCsv = () => {
    if (!exportRows.length) return;
    downloadText(`gym-progress-history-${exportDate}.csv`, historyToCsv(exportRows), "text/csv;charset=utf-8");
  };

  const handlePdf = () => {
    if (!exportRows.length) return;
    const report = window.open("", "_blank", "noopener,noreferrer");
    if (!report) return;
    const rows = exportRows.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${item.completedAt ? escapeHtml(new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })) : "—"}</td><td>${item.totalSets}</td><td>${Math.round(item.totalVolume).toLocaleString()} kg</td><td>${escapeHtml(item.notes || "")}</td></tr>`).join("");
    report.document.write(`<!doctype html><html><head><title>Gym Progress Pro — Workout History</title><style>body{font-family:Inter,Arial,sans-serif;color:#202723;margin:42px}header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #202723;padding-bottom:18px;margin-bottom:28px}h1{font-size:28px;margin:6px 0 0;letter-spacing:-.04em}p{color:#77736b;font-size:12px;margin:0}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;color:#77736b;font-size:9px;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #cfc8bc;padding:10px 8px}td{padding:11px 8px;border-bottom:1px solid #e8e2d8;vertical-align:top}td:nth-child(3),td:nth-child(4){white-space:nowrap}footer{margin-top:24px;color:#969087;font-size:10px}@media print{body{margin:18mm}button{display:none}}</style></head><body><header><div><p>GYM PROGRESS PRO / TRAINING ROOM</p><h1>Workout history</h1></div><p>Exported ${exportDate}</p></header><table><thead><tr><th>Session</th><th>Date</th><th>Sets</th><th>Volume</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><footer>${exportRows.length} completed session${exportRows.length === 1 ? "" : "s"} · Keep the next set countable.</footer><script>window.onload=function(){window.print()}</script></body></html>`);
    report.document.close();
  };

  return <>
    <PageHeader eyebrow="TRAINING ROOM / HISTORY" title="Your work, kept." description="Search every completed session and revisit the details that made it count." action={<Link href="/progress" className="secondary-button">View charts <ArrowUpRight size={15} /></Link>} />
    <div className="history-tools"><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions…" /></div><span className="toolbar-note">{history.data?.length || 0} sessions</span><div className="export-actions"><button className="secondary-button" onClick={handleCsv} disabled={exportHistory.isLoading || !exportRows.length}><Download size={15} /> CSV</button><button className="secondary-button" onClick={handlePdf} disabled={exportHistory.isLoading || !exportRows.length}><FileText size={15} /> PDF</button></div></div>
    <p className="export-note">Exports include {exportRows.length} completed session{exportRows.length === 1 ? "" : "s"}. PDF opens a print-ready report so you can save it as a PDF.</p>
    {history.isLoading ? <div className="loading-panel"><div className="pulse-dot" />Searching your logs…</div> : history.data?.length ? <section className="panel history-full"><div className="history-head"><span>Session</span><span>Date</span><span>Sets</span><span>Volume</span><span /></div>{history.data.map(item => <Link className="history-row" href={`/history/${item.id}`} key={item.id}><div className="history-session"><div className="session-icon"><CalendarDays size={16} /></div><strong>{item.name}</strong></div><span>{item.completedAt ? new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</span><span>{item.totalSets}</span><span>{Math.round(item.totalVolume).toLocaleString()} kg</span><ChevronRight size={16} /></Link>)}</section> : <EmptyState title={search ? "No matching sessions" : "Your history is empty"} copy={search ? "Try another session name." : "Complete a workout and it will land here."} action={<Link href="/workout/new" className="secondary-button">Start a workout</Link>} />}
  </>;
}
