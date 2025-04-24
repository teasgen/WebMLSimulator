import { BrowserRouter as Router, Routes, Route } from 'react-router';

import Menu from "./components/Menu";
import Simulation from "./components/Simulation";
import TasksHierarcy from "./components/TasksHierachy";
import TaskSolver from "./components/TaskSolver";
import SingleHistory from './components/HistoryPage';
import History from './components/FullHistoryPage';
import Test from "./components/Test";
import Login from "./components/Login";
import Register from "./components/Registration";
import Recommendations from './components/Recommendations';
import EmailVerification from './components/email_components/EmailVerification';
import ForgotPassword from './components/email_components/ForgotPassword';
import ResetPassword from './components/email_components/ResetPassword';


function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/menu/*" element={<Menu />} />
          <Route path="/simulator/*" element={<Simulation />} />
          <Route path="/practice" element={<TasksHierarcy />} />
          <Route path="/practice/task" element={<TaskSolver />} />
          <Route path="/single-history" element={<SingleHistory />} />
          <Route path="/history" element={<History />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/verify-email/:token" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
