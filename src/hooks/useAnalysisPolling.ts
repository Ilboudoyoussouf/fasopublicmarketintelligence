"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAnalysisStatusAction } from "@/app/admin/actions";
import type { AnalysisStatus } from "@/lib/ingestion/pipeline";

const POLL_INTERVAL_MS = 4000;

export type PolledStatus = AnalysisStatus | { status: "poll_failed"; error: string };

/**
 * Suit par polling une ou plusieurs analyses/imports lancés en arrière-plan
 * (voir pipeline.ts : runAnalysisInBackground, ingestExistingDocument).
 * Aucune requête HTTP n'est jamais tenue ouverte le temps qu'une extraction
 * Gemini se termine — ce qui peut prendre plusieurs minutes sur un gros
 * document, largement au-delà de ce que tolère le proxy inverse devant
 * l'hébergement de production (constaté en conditions réelles : la requête
 * expire côté proxy avant que Gemini ne réponde). Chaque requête de suivi
 * est courte et n'a, elle, aucune chance d'expirer.
 */
export function useAnalysisPolling() {
  const [statuses, setStatuses] = useState<Record<string, PolledStatus>>({});
  const activeRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => () => {
    Object.values(timeoutsRef.current).forEach(clearTimeout);
  }, []);

  const start = useCallback((documentId: string) => {
    activeRef.current.add(documentId);
    setStatuses((prev) => ({ ...prev, [documentId]: { status: "processing" } }));

    const tick = async () => {
      if (!activeRef.current.has(documentId)) return; // arrêté (reset, ou remplacé)
      try {
        const result = await getAnalysisStatusAction(documentId);
        if (!activeRef.current.has(documentId)) return;
        if (!result.ok) {
          setStatuses((prev) => ({ ...prev, [documentId]: { status: "poll_failed", error: result.error } }));
          return;
        }
        if (result.status === "processing") {
          timeoutsRef.current[documentId] = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        setStatuses((prev) => ({ ...prev, [documentId]: result }));
      } catch (err) {
        if (!activeRef.current.has(documentId)) return;
        // Un aléa réseau sur UNE requête de suivi ne doit pas arrêter le
        // suivi — c'est justement ce que le polling est censé absorber.
        timeoutsRef.current[documentId] = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    tick();
  }, []);

  const stop = useCallback((documentId: string) => {
    activeRef.current.delete(documentId);
    if (timeoutsRef.current[documentId]) clearTimeout(timeoutsRef.current[documentId]);
  }, []);

  const reset = useCallback(() => {
    activeRef.current.clear();
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    setStatuses({});
  }, []);

  return { statuses, start, stop, reset };
}
