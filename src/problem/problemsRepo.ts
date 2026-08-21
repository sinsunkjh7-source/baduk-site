import type { Problem } from "./types";
import { supabase } from "./supabaseClient";

const LOCAL_STORAGE_KEY = "baduk-problems";
const TABLE = "problems";

interface ProblemRow {
  id: string;
  unit_id: string;
  level_id: string;
  sequence: number;
  title: string;
  size: number;
  region: Problem["region"] | null;
  initial_stones: Problem["initialStones"];
  player_color: Problem["playerColor"];
  correct_points: Problem["correctPoints"];
}

function rowToProblem(row: ProblemRow): Problem {
  return {
    id: row.id,
    location: { unitId: row.unit_id, levelId: row.level_id, sequence: row.sequence },
    title: row.title,
    size: row.size,
    region: row.region ?? undefined,
    initialStones: row.initial_stones,
    playerColor: row.player_color,
    correctPoints: row.correct_points,
  };
}

function problemToRow(problem: Problem): ProblemRow {
  return {
    id: problem.id,
    unit_id: problem.location.unitId,
    level_id: problem.location.levelId,
    sequence: problem.location.sequence,
    title: problem.title,
    size: problem.size,
    region: problem.region ?? null,
    initial_stones: problem.initialStones,
    player_color: problem.playerColor,
    correct_points: problem.correctPoints,
  };
}

function readLocal(): Problem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Problem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(problems: Problem[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(problems));
}

export async function listProblems(): Promise<Problem[]> {
  if (supabase) {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    return (data as ProblemRow[]).map(rowToProblem);
  }
  return readLocal();
}

export async function createProblem(problem: Problem): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).insert(problemToRow(problem));
    if (error) throw error;
    return;
  }
  writeLocal([...readLocal(), problem]);
}

export async function updateProblem(problem: Problem): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).update(problemToRow(problem)).eq("id", problem.id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((p) => (p.id === problem.id ? problem : p)));
}

export async function deleteProblem(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().filter((p) => p.id !== id));
}

export async function bulkInsertIfEmpty(seed: Problem[]): Promise<void> {
  const existing = await listProblems();
  if (existing.length > 0) return;
  if (supabase) {
    const { error } = await supabase.from(TABLE).insert(seed.map(problemToRow));
    if (error) throw error;
    return;
  }
  writeLocal(seed);
}
