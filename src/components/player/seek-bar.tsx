import { memo, useRef } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { formatDuration } from "@/lib/utils";

export const SeekBar = memo(function SeekBar() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isDragging = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  function seekFromEvent(clientX: number) {
    if (!barRef.current || !duration) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    seekFromEvent(e.clientX);

    function onMouseMove(ev: MouseEvent) {
      if (isDragging.current) seekFromEvent(ev.clientX);
    }
    function onMouseUp(ev: MouseEvent) {
      if (isDragging.current) {
        isDragging.current = false;
        seekFromEvent(ev.clientX);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-10 text-right text-xs text-muted-foreground">{formatDuration(currentTime)}</span>
      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        tabIndex={0}
        className="group relative h-1 flex-1 cursor-pointer rounded-full bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
        onMouseDown={handleMouseDown}
        onClick={(e) => seekFromEvent(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") seek(Math.min(duration, currentTime + 5));
          if (e.key === "ArrowLeft") seek(Math.max(0, currentTime - 5));
        }}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] group-hover:bg-primary/80"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${progress}%`, marginLeft: -6 }}
        />
      </div>
      <span className="w-10 text-xs text-muted-foreground">{formatDuration(duration)}</span>
    </div>
  );
});
