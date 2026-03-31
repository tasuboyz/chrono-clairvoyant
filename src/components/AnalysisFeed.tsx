import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface StepState {
  status: "pending" | "active" | "done" | "skipped";
  label: string;
  detail: string;
  durationMs?: number;
}

const INITIAL_STEPS: StepState[] = [
  { status: "pending", label: "Analisi AI immagine", detail: "" },
  { status: "pending", label: "Generazione descrizione", detail: "" },
  { status: "pending", label: "Ricerca database", detail: "" },
  { status: "pending", label: "Ricerca mercato", detail: "" },
  { status: "pending", label: "Sintesi dati", detail: "" },
];

interface AnalysisFeedProps {
  sessionId: string;
  onDone: (result: Record<string, unknown>) => void;
  onError: (message: string) => void;
}

export default function AnalysisFeed({ sessionId, onDone, onError }: AnalysisFeedProps) {
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);

  const stableOnDone = useCallback(onDone, []);  // eslint-disable-line react-hooks/exhaustive-deps
  const stableOnError = useCallback(onError, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const es = new EventSource(`/api/analyze/stream?session_id=${sessionId}`);

    es.onmessage = (e: MessageEvent) => {
      const p = JSON.parse(e.data) as {
        event: string;
        step?: number;
        label?: string;
        detail?: string;
        duration_ms?: number;
        data?: { watch: Record<string, unknown>; description: string };
        message?: string;
      };

      if (p.event === "step_start" && p.step !== undefined) {
        setSteps(prev =>
          prev.map((s, i) =>
            i === p.step! - 1 ? { ...s, status: "active", detail: p.detail ?? "" } : s
          )
        );
      } else if (p.event === "step_complete" && p.step !== undefined) {
        setSteps(prev =>
          prev.map((s, i) =>
            i === p.step! - 1
              ? { ...s, status: "done", detail: p.detail ?? "", durationMs: p.duration_ms }
              : s
          )
        );
      } else if (p.event === "step_skipped" && p.step !== undefined) {
        setSteps(prev =>
          prev.map((s, i) =>
            i === p.step! - 1
              ? { ...s, status: "skipped", detail: p.detail ?? "", durationMs: p.duration_ms }
              : s
          )
        );
      } else if (p.event === "debug") {
        console.debug("[AI DEBUG]", p.label || "", p.detail || "");
      } else if (p.event === "done" && p.data) {
        es.close();
        stableOnDone(p.data);
      } else if (p.event === "error") {
        es.close();
        stableOnError(p.message ?? "Errore sconosciuto.");
      }
    };

    es.onerror = () => {
      es.close();
      stableOnError("Connessione interrotta.");
    };

    return () => es.close();
  }, [sessionId, stableOnDone, stableOnError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-lg border border-border bg-card/50 p-5 space-y-4"
    >
      <p className="text-sm text-muted-foreground text-center font-medium">Analisi in corso...</p>
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-5 h-5">
            {step.status === "done" && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {step.status === "active" && (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
            {step.status === "skipped" && (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            {step.status === "pending" && (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                step.status === "pending" ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{step.detail}</p>
            )}
          </div>
          {step.status === "done" && step.durationMs !== undefined && (
            <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
              {(step.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      ))}
    </motion.div>
  );
}
