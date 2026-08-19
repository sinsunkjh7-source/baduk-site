import { getUnit, getLevel } from "../curriculum/units";
import { getProblemsByLevel } from "../problem/data";
import { ProblemSetPlayer } from "../problem/ProblemSetPlayer";

interface LevelPageProps {
  unitId: string;
  levelId: string;
  onBack: () => void;
}

export function LevelPage({ unitId, levelId, onBack }: LevelPageProps) {
  const unit = getUnit(unitId);
  const level = getLevel(unitId, levelId);
  const problems = getProblemsByLevel(unitId, levelId);
  if (!unit || !level) return null;

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ◀ {unit.name}
      </button>
      <h1>
        {unit.name} · {level.label}
      </h1>
      {problems.length > 0 ? (
        <ProblemSetPlayer problems={problems} />
      ) : (
        <p>아직 준비된 문제가 없습니다.</p>
      )}
    </div>
  );
}
