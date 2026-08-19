import { getUnit } from "../curriculum/units";
import { getProblemsByLevel } from "../problem/data";

interface UnitPageProps {
  unitId: string;
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
}

export function UnitPage({ unitId, onSelectLevel, onBack }: UnitPageProps) {
  const unit = getUnit(unitId);
  if (!unit) return null;

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ◀ 단원 목록
      </button>
      <h1>{unit.name}</h1>
      <div className="level-list">
        {unit.levels.map((level) => {
          if (level.kind === "video") {
            return (
              <div key={level.id} className="level-card disabled">
                <div className="level-card-label">{level.label}</div>
                <div className="level-card-status">동영상 준비 중</div>
              </div>
            );
          }
          const count = getProblemsByLevel(unitId, level.id).length;
          return (
            <button
              key={level.id}
              className="level-card"
              disabled={count === 0}
              onClick={() => onSelectLevel(level.id)}
            >
              <div className="level-card-label">{level.label}</div>
              <div className="level-card-status">{count > 0 ? `문제 ${count}개` : "문제 준비 중"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
