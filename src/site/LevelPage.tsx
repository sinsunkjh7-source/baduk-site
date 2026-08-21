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
      <div className="level-page-header">
        <button className="back-link" onClick={onBack}>
          ◀ {unit.name}
        </button>
        <span className="level-page-title">
          {unit.name} · {level.label}
        </span>
      </div>
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
