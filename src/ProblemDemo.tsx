import { ProblemSetPlayer } from "./problem/ProblemSetPlayer";
import { getProblemsByUnit } from "./problem/data";
import { useProblems } from "./problem/store";

export function ProblemDemo() {
  const { problems } = useProblems();
  const unitProblems = getProblemsByUnit(problems, "ttaenaegi");

  return (
    <div className="app">
      <ProblemSetPlayer problems={unitProblems} />
    </div>
  );
}
