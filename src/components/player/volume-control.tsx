import { memo, useRef } from "react";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { usePlayerStore } from "@/stores/player-store";

export const VolumeControl = memo(function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const displayVolume = isMuted ? 0 : volume;
  const isDragging = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  function volumeFromEvent(clientX: number) {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(ratio);
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    volumeFromEvent(e.clientX);

    function onMouseMove(ev: MouseEvent) {
      if (isDragging.current) volumeFromEvent(ev.clientX);
    }
    function onMouseUp(ev: MouseEvent) {
      if (isDragging.current) {
        isDragging.current = false;
        volumeFromEvent(ev.clientX);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <VolumeIcon size={16} />
      </button>
      <div
        ref={barRef}
        role="slider"
        aria-label="Volume"
        aria-valuenow={Math.round(displayVolume * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        className="group relative h-1 w-20 cursor-pointer rounded-full bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
        onMouseDown={handleMouseDown}
        onClick={(e) => volumeFromEvent(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setVolume(Math.min(1, volume + 0.05));
          if (e.key === "ArrowLeft") setVolume(Math.max(0, volume - 0.05));
        }}
      >
        <div
          className="h-full rounded-full bg-muted-foreground transition-[width] group-hover:bg-primary"
          style={{ width: `${displayVolume * 100}%` }}
        />
      </div>
    </div>
  );
});
