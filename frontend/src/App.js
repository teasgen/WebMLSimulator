import { BrowserRouter as Router, Routes, Route } from 'react-router';

import Menu from "./components/Menu";
import Simulation from "./components/Simulation";


function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/menu/*" element={<Menu />} />
          <Route path="/simulator/*" element={<Simulation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
