import { useState } from "react";
import { CoreEngineDemo } from "./CoreEngineDemo";
import { ProblemDemo } from "./ProblemDemo";
import { LectureBoard } from "./lecture/LectureBoard";
import "./App.css";

type Tab = "engine" | "problem" | "lecture";

function App() {
  const [tab, setTab] = useState<Tab>("engine");

  return (
    <div className="app-root">
      <nav className="tabs">
        <button className={tab === "engine" ? "active" : ""} onClick={() => setTab("engine")}>
          바둑판 코어 엔진
        </button>
        <button className={tab === "problem" ? "active" : ""} onClick={() => setTab("problem")}>
          문제 풀이
        </button>
        <button className={tab === "lecture" ? "active" : ""} onClick={() => setTab("lecture")}>
          강의용 바둑판
        </button>
      </nav>
      {tab === "engine" && <CoreEngineDemo />}
      {tab === "problem" && <ProblemDemo />}
      {tab === "lecture" && <LectureBoard />}
    </div>
  );
}

export default App;
