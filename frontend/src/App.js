import { BrowserRouter as Router, Routes, Route } from 'react-router';

import Menu from "./components/Menu";
import Simulation from "./components/Simulation";
import TasksHierarcy from "./components/TasksHierachy";
import TaskSolver from "./components/TaskSolver";


function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/menu/*" element={<Menu />} />
          <Route path="/simulator/*" element={<Simulation />} />
          <Route path="/practice" element={<TasksHierarcy />} />
          <Route path="/practice/task" element={<TaskSolver />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
