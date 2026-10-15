import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/hires/")({ component: HiresPage });

function HiresPage() {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRef<{ show: (w: "r34" | "diablo", p?: object) => void; setColor: (c: string) => void } | null>(null);
  const [car, setCar] = useState<"r34" | "diablo">("r34");
  const [color, setColor] = useState("#c41822");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { createHiresPreview } = await import("@/game/hires/preview");
      if (!mounted || !ref.current) return;
      api.current = createHiresPreview(ref.current);
    })();
    return () => {
      mounted = false;
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.show(car, { body: color });
  }, [car, color]);

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col">
      <div className="p-4 flex gap-3 items-center border-b border-white/10">
        <button
          onClick={() => setCar("r34")}
          className={`px-4 py-2 rounded-lg ${car === "r34" ? "bg-orange-500" : "bg-white/10"}`}
        >
          R34
        </button>
        <button
          onClick={() => setCar("diablo")}
          className={`px-4 py-2 rounded-lg ${car === "diablo" ? "bg-orange-500" : "bg-white/10"}`}
        >
          Diablo VT
        </button>
        <label className="ml-4 flex items-center gap-2 text-sm">
          Lack
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 bg-transparent" />
        </label>
        <a href="/" className="ml-auto text-sm opacity-70 hover:opacity-100">Zurück</a>
      </div>
      <div ref={ref} className="flex-1" />
    </div>
  );
}
