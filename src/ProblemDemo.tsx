import { ProblemBoard } from "./problem/ProblemBoard";
import { getProblemsByUnit } from "./problem/data";
import { formatProblemCode } from "./problem/problemCode";

export function ProblemDemo() {
  const problems = getProblemsByUnit("ttaenaegi");

  return (
    <div className="app">
      {problems.map((problem) => (
        <ProblemBoard key={problem.id} problem={problem} code={formatProblemCode(problem)} />
      ))}
    </div>
  );
}
