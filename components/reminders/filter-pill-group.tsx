// components/reminders/filter-pill-group.tsx

export type FilterOption = { value: string; label: string };

type FilterPillGroupProps = {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
};

export function FilterPillGroup({
  label,
  options,
  value,
  onChange,
}: FilterPillGroupProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-2 py-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "rounded-full px-2 py-1 text-[11px] transition",
                active
                  ? "bg-sky-500/90 text-slate-950"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
