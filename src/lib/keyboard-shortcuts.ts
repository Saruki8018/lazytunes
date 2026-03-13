/** Register DOM keyboard shortcuts for player controls */
export function initKeyboardShortcuts(actions: {
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  setVolume: (v: number) => void;
  getVolume: () => number;
  toggleMute: () => void;
}): () => void {
  function handler(e: KeyboardEvent) {
    // Ctrl+F: focus search input regardless of where focus is
    if (e.ctrlKey && e.code === "KeyF") {
      e.preventDefault();
      const focusSearch = (window as unknown as Record<string, unknown>).__focusSearch;
      if (typeof focusSearch === "function") focusSearch();
      return;
    }

    // Don't trigger player shortcuts when typing in an input or contentEditable
    const target = e.target as HTMLElement;
    const tag = target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (target?.isContentEditable) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        actions.togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        actions.seek(Math.max(0, actions.getCurrentTime() - 5));
        break;
      case "ArrowRight":
        e.preventDefault();
        actions.seek(actions.getCurrentTime() + 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        actions.setVolume(Math.min(1, actions.getVolume() + 0.1));
        break;
      case "ArrowDown":
        e.preventDefault();
        actions.setVolume(Math.max(0, actions.getVolume() - 0.1));
        break;
      case "KeyM":
        e.preventDefault();
        actions.toggleMute();
        break;
      case "KeyN":
        e.preventDefault();
        actions.next();
        break;
      case "KeyP":
        e.preventDefault();
        actions.prev();
        break;
    }
  }

  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
