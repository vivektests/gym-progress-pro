export type HistoryExportRow = {
  name: string;
  completedAt: Date | string | null;
  totalSets: number;
  totalVolume: number;
  notes?: string | null;
};

export function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function historyToCsv(rows: HistoryExportRow[]) {
  const header = ["Session", "Completed date", "Total sets", "Total volume (kg)", "Notes"];
  const lines = rows.map(row => [
    row.name,
    row.completedAt ? new Date(row.completedAt).toISOString() : "",
    row.totalSets,
    Math.round(row.totalVolume),
    row.notes ?? "",
  ].map(escapeCsv).join(","));
  return [header.join(","), ...lines].join("\n");
}
