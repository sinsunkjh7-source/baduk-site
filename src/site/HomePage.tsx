import { units } from "../curriculum/units";
import { getProblemsByUnit } from "../problem/data";
import { useProblems } from "../problem/store";

export function HomePage({ onSelectUnit }: { onSelectUnit: (unitId: string) => void }) {
  const { problems } = useProblems();
  return (
    <div className="page">
      <h1>단원 선택</h1>
      <div className="unit-grid">
        {units.map((unit) => {
          const problemCount = getProblemsByUnit(problems, unit.id).length;
          return (
            <button key={unit.id} className="unit-card" onClick={() => onSelectUnit(unit.id)}>
              <div className="unit-card-name">{unit.name}</div>
              <div className="unit-card-meta">
                레벨 {unit.levels.length}개 · 문제 {problemCount}개
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
