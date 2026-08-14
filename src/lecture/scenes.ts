import type { MoveTreeState } from "./types";

export interface Scene {
  id: string;
  name: string;
  savedAt: number;
  tree: MoveTreeState;
}

const STORAGE_KEY = "baduk-lecture-scenes";

export function listScenes(): Scene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Scene[]) : [];
  } catch {
    return [];
  }
}

export function saveScene(name: string, tree: MoveTreeState): Scene {
  const scene: Scene = { id: crypto.randomUUID(), name, savedAt: Date.now(), tree };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...listScenes(), scene]));
  return scene;
}

export function deleteScene(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listScenes().filter((s) => s.id !== id)));
}
