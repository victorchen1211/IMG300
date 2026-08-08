"use client";

import { useState, useCallback, useEffect } from "react";
import {
  CompositionFeatureVector,
  generateCompositionDataset,
  DatasetGenerationOptions
} from "../utils/datasetGenerator";

export interface PairwisePreferenceRecord {
  id: string;
  timestamp: string;
  scenarioName: string;
  compositionA: CompositionFeatureVector;
  compositionB: CompositionFeatureVector;
  preferredCompositionId: string;
  winner: "A" | "B" | "tie";
}

export function usePairwisePreferenceCollector(
  options: DatasetGenerationOptions = { batchSize: 20, topKPerScenario: 3 }
) {
  const [dataset, setDataset] = useState<CompositionFeatureVector[]>([]);
  const [preferences, setPreferences] = useState<PairwisePreferenceRecord[]>([]);
  const [currentPair, setCurrentPair] = useState<{
    compA: CompositionFeatureVector;
    compB: CompositionFeatureVector;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize and load dataset
  const generateNewBatch = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const res = generateCompositionDataset(options);
      setDataset(res.dataset);

      // Pick first pair from dataset
      if (res.dataset.length >= 2) {
        setCurrentPair({
          compA: res.dataset[0],
          compB: res.dataset[1]
        });
      }
      setIsLoading(false);
    }, 50);
  }, [options]);

  useEffect(() => {
    generateNewBatch();
  }, []);

  // Pick Next Random Pair from Dataset
  const nextPair = useCallback(() => {
    if (dataset.length < 2) {
      generateNewBatch();
      return;
    }

    const idxA = Math.floor(Math.random() * dataset.length);
    let idxB = Math.floor(Math.random() * dataset.length);
    while (idxB === idxA) {
      idxB = Math.floor(Math.random() * dataset.length);
    }

    setCurrentPair({
      compA: dataset[idxA],
      compB: dataset[idxB]
    });
  }, [dataset, generateNewBatch]);

  // Record Designer Pairwise Preference Choice (A, B, or Tie)
  const recordPreference = useCallback(
    (winner: "A" | "B" | "tie") => {
      if (!currentPair) return;

      const record: PairwisePreferenceRecord = {
        id: `pref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        scenarioName: currentPair.compA.scenarioName,
        compositionA: currentPair.compA,
        compositionB: currentPair.compB,
        preferredCompositionId:
          winner === "A"
            ? currentPair.compA.compositionId
            : winner === "B"
            ? currentPair.compB.compositionId
            : "tie",
        winner
      };

      setPreferences((prev) => [record, ...prev]);

      // Automatically advance to next pair
      nextPair();
    },
    [currentPair, nextPair]
  );

  // Export Pairwise Preferences Dataset as JSON File
  const exportPreferencesJSON = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preferences, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pairwise_preferences_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [preferences]);

  return {
    currentPair,
    preferences,
    totalPreferenceCount: preferences.length,
    isLoading,
    generateNewBatch,
    nextPair,
    recordPreference,
    exportPreferencesJSON
  };
}
