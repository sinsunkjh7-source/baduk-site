import { getUnit, getLevel } from "../curriculum/units";
import { getProblemsByLevel } from "../problem/data";
import { useProblems } from "../problem/store";
import { ProblemSetPlayer } from "../problem/ProblemSetPlayer";

interface LevelPageProps {
  unitId: string;
  levelId: string;
  onBack: () => void;
}

export function LevelPage({ unitId, levelId, onBack }: LevelPageProps) {
  const unit = getUnit(unitId);
  const level = getLevel(unitId, levelId);
  const { problems, loading } = useProblems();
  const levelProblems = getProblemsByLevel(problems, unitId, levelId);
  if (!unit || !level) return null;

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ◀ {unit.name}
      </button>
      <h1>
        {unit.name} · {level.label}
      </h1>
      {loading ? (
        <p>불러오는 중...</p>
      ) : levelProblems.length > 0 ? (
        <ProblemSetPlayer problems={levelProblems} />
      ) : (
        <p>아직 준비된 문제가 없습니다.</p>
      )}
    </div>
  );
}
