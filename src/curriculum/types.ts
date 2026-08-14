export interface Level {
  /** e.g. "1-1", "1-2", "2-1" */
  id: string;
  /** e.g. "기본 개념", "기본 문제", "심화 문제" */
  label: string;
  kind: "video" | "problem";
}

export interface Unit {
  id: string;
  /** e.g. "축" */
  name: string;
  levels: Level[];
}
