import { cn } from "@/lib/utils";

interface MatrixPreviewProps {
  size: number;
  data?: Record<string, string>;
  riskLevels?: { id: string; color: string }[];
  className?: string;
}

export function MatrixPreview({
  size,
  data = {},
  riskLevels = [],
  className,
}: MatrixPreviewProps) {
  const riskLevelMap = new Map(riskLevels.map((l) => [l.id, l]));

  return (
    <div
      className={cn(
        "aspect-square bg-muted/20 border border-border rounded-sm overflow-hidden grid",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {Array.from({ length: size * size }).map((_, i) => {
        const x = (i % size) + 1;
        const y = size - Math.floor(i / size);
        const cellKey = `${x}-${y}`;

        const levelId = data[cellKey];
        const level = riskLevelMap.get(levelId);
        const bgColor = level?.color || "bg-transparent";

        return (
          <div
            key={cellKey}
            className={cn("border-[0.5px] border-border/30", bgColor)}
          />
        );
      })}
    </div>
  );
}
