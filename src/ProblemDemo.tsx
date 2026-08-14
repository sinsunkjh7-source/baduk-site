import { ProblemSetPlayer } from "./problem/ProblemSetPlayer";
import { getProblemsByUnit } from "./problem/data";

export function ProblemDemo() {
  const problems = getProblemsByUnit("ttaenaegi");

  return (
    <div className="app">
      <ProblemSetPlayer problems={problems} />
    </div>
  );
}
