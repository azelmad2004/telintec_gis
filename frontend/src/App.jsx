import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TechnicienPage from "./pages/TechnicienPage";
import PlanningPage from "./pages/PlanningPage";

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/technicien" />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/technicien"
          element={
            <PrivateRoute>
              <TechnicienPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/planning"
          element={
            <PrivateRoute role="admin">
              <PlanningPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;