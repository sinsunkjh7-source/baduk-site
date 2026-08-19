import { useState } from "react";
import { HomePage } from "./site/HomePage";
import { UnitPage } from "./site/UnitPage";
import { LevelPage } from "./site/LevelPage";
import { LectureBoard } from "./lecture/LectureBoard";
import { SoundPicker } from "./sound/SoundPicker";
import type { View } from "./site/types";
import "./App.css";

function App() {
  const [view, setView] = useState<View>({ screen: "home" });
  const isHomeArea = view.screen === "home" || view.screen === "unit" || view.screen === "level";

  return (
    <div className="app-root">
      <header className="site-header">
        <span className="site-title">바둑 교육 사이트</span>
        <nav>
          <button className={isHomeArea ? "active" : ""} onClick={() => setView({ screen: "home" })}>
            바둑 교육
          </button>
          <button
            className={view.screen === "lecture" ? "active" : ""}
            onClick={() => setView({ screen: "lecture" })}
          >
            바둑판
          </button>
        </nav>
        <SoundPicker />
      </header>

      <main>
        {view.screen === "home" && (
          <HomePage onSelectUnit={(unitId) => setView({ screen: "unit", unitId })} />
        )}
        {view.screen === "unit" && (
          <UnitPage
            unitId={view.unitId}
            onSelectLevel={(levelId) => setView({ screen: "level", unitId: view.unitId, levelId })}
            onBack={() => setView({ screen: "home" })}
          />
        )}
        {view.screen === "level" && (
          <LevelPage
            unitId={view.unitId}
            levelId={view.levelId}
            onBack={() => setView({ screen: "unit", unitId: view.unitId })}
          />
        )}
        {view.screen === "lecture" && <LectureBoard />}
      </main>
    </div>
  );
}

export default App;
