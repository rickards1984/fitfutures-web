import { useMemo, useRef, useState, type FormEvent } from "react";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import { useEvidence } from "../hooks/useEvidence";
import type { EvidenceItem, Unit } from "../api/client";
import { formatTimestamp } from "../utils/format";

// Maps unit_task_id -> "Unit N · task description" for the picker + grouping.
function taskIndex(units: Unit[]) {
  const map = new Map<string, { unitNumber: number; label: string }>();
  for (const u of units) {
    for (const t of u.tasks) {
      map.set(t.id, {
        unitNumber: u.unit_number,
        label: `Unit ${u.unit_number} · ${t.description}`,
      });
    }
  }
  return map;
}

function approvalBadge(item: EvidenceItem) {
  if (item.supervisor_approved === true)
    return <Badge label="Approved" tone="success" />;
  if (item.supervisor_approved === false)
    return <Badge label="Changes requested" tone="danger" />;
  return <Badge label="Pending review" tone="muted" />;
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const isImage = item.file_type.startsWith("image/") && item.download_url;
  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
      <div className="flex h-28 items-center justify-center bg-brand-bg">
        {isImage ? (
          <img
            src={item.download_url!}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl text-brand-muted" aria-hidden>
            ❐
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm text-brand-text" title={item.title}>
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-brand-muted">
          {formatTimestamp(item.created_at)}
        </p>
        <div className="mt-2">{approvalBadge(item)}</div>
      </div>
    </div>
  );
}

function UploadForm({
  units,
  busy,
  onUpload,
}: {
  units: Unit[];
  busy: boolean;
  onUpload: (file: File, title: string, unitTaskId: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [unitTaskId, setUnitTaskId] = useState("");
  const [fileName, setFileName] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    onUpload(file, title, unitTaskId || null);
    setTitle("");
    setUnitTaskId("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClass =
    "w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4"
    >
      <label className="block">
        <span className="text-sm text-brand-text">File</span>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text"
          >
            Choose file
          </button>
          <span className="truncate text-xs text-brand-muted">
            {fileName || "No file selected"}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputClass}
      />

      <select
        value={unitTaskId}
        onChange={(e) => setUnitTaskId(e.target.value)}
        className={inputClass}
      >
        <option value="">No unit (general)</option>
        {units.map((u) => (
          <optgroup key={u.id} label={`Unit ${u.unit_number} — ${u.title}`}>
            {u.tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.description}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <button
        type="submit"
        disabled={busy || !fileName}
        className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Upload evidence"}
      </button>
    </form>
  );
}

export default function EvidencePage() {
  const { placement, units, items, loading, noPlacement, error, upload } =
    useEvidence();
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const tasks = useMemo(() => taskIndex(units), [units]);

  // Group evidence by unit (general bucket last).
  const groups = useMemo(() => {
    const byUnit = new Map<number, EvidenceItem[]>();
    const general: EvidenceItem[] = [];
    for (const item of items) {
      const meta = item.unit_task_id ? tasks.get(item.unit_task_id) : undefined;
      if (meta) {
        const arr = byUnit.get(meta.unitNumber) ?? [];
        arr.push(item);
        byUnit.set(meta.unitNumber, arr);
      } else {
        general.push(item);
      }
    }
    const ordered = [...byUnit.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([unitNumber, list]) => ({
        title: `Unit ${unitNumber}`,
        items: list,
      }));
    if (general.length) ordered.push({ title: "General", items: general });
    return ordered;
  }, [items, tasks]);

  async function handleUpload(
    file: File,
    title: string,
    unitTaskId: string | null,
  ) {
    setUploadError(null);
    setBusy(true);
    try {
      await upload(file, title, unitTaskId);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Evidence" subtitle="Upload and organise your evidence" />

      <div className="space-y-4 px-4">
        {loading && <p className="text-sm text-brand-muted">Loading…</p>}
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {noPlacement && (
          <p className="text-sm text-brand-muted">
            You need an active placement before uploading evidence.
          </p>
        )}

        {placement && (
          <>
            <UploadForm units={units} busy={busy} onUpload={handleUpload} />
            {uploadError && (
              <p className="text-xs text-brand-danger">{uploadError}</p>
            )}

            {items.length === 0 ? (
              <p className="text-sm text-brand-muted">
                No evidence yet. Upload your first file above.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.title}>
                  <h2 className="mb-2 text-sm font-medium text-brand-text">
                    {group.title}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <EvidenceCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
