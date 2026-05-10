import { useMemo, useState } from "react";
import { HIGHLIGHT_PHRASES, CATEGORY_COLORS, type HighlightCategory } from "@/lib/highlight-phrases";

interface TextSegment {
  text: string;
  category?: HighlightCategory;
}

function parseSegments(text: string): TextSegment[] {
  // Build a map of [start, end) → category using longest-first matching
  const markers: { start: number; end: number; category: HighlightCategory }[] = [];
  const lower = text.toLowerCase();

  for (const { phrase, category } of HIGHLIGHT_PHRASES) {
    let idx = 0;
    while ((idx = lower.indexOf(phrase, idx)) !== -1) {
      const end = idx + phrase.length;
      // Skip if this range overlaps an already-marked span
      const overlaps = markers.some((m) => idx < m.end && end > m.start);
      if (!overlaps) markers.push({ start: idx, end, category });
      idx = end;
    }
  }

  // Sort markers by position
  markers.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const { start, end, category } of markers) {
    if (cursor < start) segments.push({ text: text.slice(cursor, start) });
    segments.push({ text: text.slice(start, end), category });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

interface HighlightedEmailBodyProps {
  text: string;
}

export function HighlightedEmailBody({ text }: HighlightedEmailBodyProps) {
  const [activeFilter, setActiveFilter] = useState<HighlightCategory | null>(null);
  const segments = useMemo(() => parseSegments(text), [text]);

  // Find which categories actually appear
  const presentCategories = useMemo(() => {
    const cats = new Set<HighlightCategory>();
    for (const seg of segments) if (seg.category) cats.add(seg.category);
    return cats;
  }, [segments]);

  if (presentCategories.size === 0) {
    return (
      <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80 leading-relaxed">
        {text}
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend / filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from(presentCategories).map((cat) => {
          const { bg, text: textColor, label } = CATEGORY_COLORS[cat];
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(isActive ? null : cat)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all"
              style={{
                backgroundColor: isActive ? bg : "transparent",
                color: textColor,
                borderColor: textColor + "55",
                opacity: activeFilter && !isActive ? 0.35 : 1,
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: textColor }}
              />
              {label}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-muted-foreground/30 text-muted-foreground hover:text-foreground transition-all"
          >
            ✕ clear
          </button>
        )}
      </div>

      {/* Highlighted text */}
      <div
        className="w-full min-h-[200px] font-mono text-sm leading-relaxed whitespace-pre-wrap rounded-md border border-muted bg-background/50 p-3 overflow-y-auto max-h-[400px]"
      >
        {segments.map((seg, i) => {
          if (!seg.category) {
            return (
              <span key={i} className="text-foreground/80">
                {seg.text}
              </span>
            );
          }
          const { bg, text: textColor } = CATEGORY_COLORS[seg.category];
          const dimmed = activeFilter !== null && activeFilter !== seg.category;
          return (
            <mark
              key={i}
              title={CATEGORY_COLORS[seg.category].label}
              style={{
                backgroundColor: dimmed ? "transparent" : bg,
                color: dimmed ? "inherit" : textColor,
                borderRadius: "3px",
                padding: "1px 2px",
                transition: "all 0.15s ease",
                fontWeight: dimmed ? "normal" : 600,
              }}
            >
              {seg.text}
            </mark>
          );
        })}
      </div>
    </div>
  );
}
