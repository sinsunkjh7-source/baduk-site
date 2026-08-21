import { useEffect, useState } from "react";
import type { Problem } from "./types";
import * as repo from "./problemsRepo";
import { ttaenaegiProblems } from "./data/ttaenaegi";

const SEEDED_FLAG_KEY = "baduk-problems-seeded";

let cache: Problem[] = [];
let loaded = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function load(): Promise<void> {
  if (!localStorage.getItem(SEEDED_FLAG_KEY)) {
    // First time this app has ever run against this data source: seed with the
    // hand-authored starter problems so nothing is lost by moving off the static file.
    // Guarded by a one-time flag (not "if empty") so deleting every problem later doesn't
    // keep bringing the seed back.
    await repo.bulkInsertIfEmpty(ttaenaegiProblems);
    localStorage.setItem(SEEDED_FLAG_KEY, "1");
  }
  cache = await repo.listProblems();
  loaded = true;
  notify();
}

function ensureLoaded(): Promise<void> {
  if (!loadPromise) loadPromise = load();
  return loadPromise;
}

export function useProblems(): { problems: Problem[]; loading: boolean } {
  const [, forceRender] = useState(0);
  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    ensureLoaded();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { problems: cache, loading: !loaded };
}

async function refresh(): Promise<void> {
  cache = await repo.listProblems();
  notify();
}

export async function saveNewProblem(problem: Problem): Promise<void> {
  await repo.createProblem(problem);
  await refresh();
}

export async function saveExistingProblem(problem: Problem): Promise<void> {
  await repo.updateProblem(problem);
  await refresh();
}

export async function removeProblem(id: string): Promise<void> {
  await repo.deleteProblem(id);
  await refresh();
}
