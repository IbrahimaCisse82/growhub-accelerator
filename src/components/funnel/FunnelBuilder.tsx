import { useState } from "react";
import GhButton from "@/components/shared/GhButton";

type FieldType = "one_liner" | "long_answer" | "single_choice" | "dropdown" | "file_upload" | "number" | "date" | "email";

interface FunnelField {
  id: string;
  type: FieldType;
  question: string;
  required: boolean;
  label?: string;
  description?: string;
  options?: string[];
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "one_liner", label: "One liner", icon: "T" },
  { type: "long_answer", label: "Long answer", icon: "T" },
  { type: "single_choice", label: "Single choice", icon: "◉" },
  { type: "dropdown", label: "Dropdown single choice", icon: "▾" },
  { type: "file_upload", label: "File upload", icon: "📎" },
  { type: "number", label: "Number", icon: "#" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "email", label: "Email", icon: "✉" },
];

interface Props {
  fields: FunnelField[];
  onChange: (fields: FunnelField[]) => void;
}

export default function FunnelBuilder({ fields, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const selectedField = fields.find(f => f.id === selectedId);
  const selectedIdx = fields.findIndex(f => f.id === selectedId);

  const addField = (type: FieldType) => {
    const newField: FunnelField = {
      id: crypto.randomUUID(),
      type,
      question: "",
      required: false,
    };
    onChange([...fields, newField]);
    setSelectedId(newField.id);
  };

  const updateField = (id: string, update: Partial<FunnelField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...update } : f));
  };

  const removeField = (id: string) => {
    const next = fields.filter(f => f.id !== id);
    onChange(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const duplicateField = (id: string) => {
    const f = fields.find(x => x.id === id);
    if (!f) return;
    const dup = { ...f, id: crypto.randomUUID() };
    const idx = fields.findIndex(x => x.id === id);
    const copy = [...fields];
    copy.splice(idx + 1, 0, dup);
    onChange(copy);
    setSelectedId(dup.id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const sourceIdx = fields.findIndex(f => f.id === draggedId);
    const targetIdx = fields.findIndex(f => f.id === targetId);
    const copy = [...fields];
    const [item] = copy.splice(sourceIdx, 1);
    copy.splice(targetIdx, 0, item);
    onChange(copy);
    setDraggedId(null);
  };

  const typeLabel = (type: FieldType) => FIELD_TYPES.find(t => t.type === type)?.label ?? type;
  const typeIcon = (type: FieldType) => FIELD_TYPES.find(t => t.type === type)?.icon ?? "T";

  return (
    <div className="grid grid-cols-[220px_1fr_280px] gap-0 border border-border rounded-xl overflow-hidden bg-card min-h-[500px]">
      {/* Left: Field palette */}
      <div className="border-r border-border p-3 space-y-1.5 bg-surface-2">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          Drag and drop →
        </div>
        {FIELD_TYPES.map(ft => (
          <button
            key={ft.type}
            onClick={() => addField(ft.type)}
            draggable
            className="w-full text-left px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-colors text-[12px] text-foreground flex items-center gap-2"
          >
            <span className="text-muted-foreground font-mono text-[11px] w-5 text-center">{ft.icon}</span>
            {ft.label}
          </button>
        ))}
      </div>

      {/* Center: Form preview */}
      <div className="p-4 space-y-3 overflow-y-auto">
        {fields.length === 0 ? (
          <div className="text-center text-muted-foreground text-[12px] py-16">
            Glissez des champs depuis la palette ou cliquez pour ajouter
          </div>
        ) : fields.map((field, idx) => (
          <div
            key={field.id}
            draggable
            onDragStart={() => setDraggedId(field.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(field.id)}
            onClick={() => setSelectedId(field.id)}
            className={`border rounded-lg transition-all cursor-pointer ${
              selectedId === field.id
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-surface-2 hover:border-border/80"
            }`}
          >
            {/* Field header */}
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground cursor-grab">⠿</span>
                <span className="font-mono text-[11px] text-foreground font-medium">{typeIcon(field.type)}</span>
                <span className="text-[11px] text-foreground font-medium">{typeLabel(field.type)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); duplicateField(field.id); }}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">📋 Duplicate</button>
                <button onClick={e => { e.stopPropagation(); removeField(field.id); }}
                  className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">🗑 Delete</button>
              </div>
            </div>
            {/* Field body */}
            <div className="px-3 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[12px] text-muted-foreground">{idx + 1}</span>
                <input
                  value={field.question}
                  onChange={e => updateField(field.id, { question: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  placeholder="Type your question here"
                  className="flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex justify-end">
                <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                  <div
                    onClick={e => { e.stopPropagation(); updateField(field.id, { required: !field.required }); }}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${field.required ? "bg-primary" : "bg-border"}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${field.required ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  Required
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Properties panel */}
      <div className="border-l border-border p-4 bg-surface-2 space-y-4">
        {selectedField ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[14px] text-primary font-bold">{selectedIdx + 1}</span>
              <span className="font-mono text-[11px] text-foreground">{typeIcon(selectedField.type)}</span>
              <span className="text-[12px] font-medium text-foreground">{typeLabel(selectedField.type)}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Label</label>
              <select
                value={selectedField.label ?? ""}
                onChange={e => updateField(selectedField.id, { label: e.target.value })}
                className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground"
              >
                <option value="">Select option</option>
                <option value="company_name">Company name</option>
                <option value="founder_name">Founder name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
                <option value="description">Description</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Description</label>
              <textarea
                value={selectedField.description ?? ""}
                onChange={e => updateField(selectedField.id, { description: e.target.value })}
                placeholder="Add description here"
                className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none h-20"
              />
            </div>

            {(selectedField.type === "single_choice" || selectedField.type === "dropdown") && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">Options</label>
                <textarea
                  value={selectedField.options?.join("\n") ?? ""}
                  onChange={e => updateField(selectedField.id, { options: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="Une option par ligne"
                  className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none h-20"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground text-[12px] py-16">
            Sélectionnez un champ pour modifier ses propriétés
          </div>
        )}
      </div>
    </div>
  );
}
