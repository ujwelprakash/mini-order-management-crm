import { useContext, useState } from "react";

import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import MainLayout from "./layouts/MainLayout";

function App() {
  const { user, loading, logout } = useContext(AuthContext);
  const [activePage, setActivePage] = useState("Dashboard");

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "Orders":
        return <Orders />;

      case "Settings":
        return <Settings />;

      case "Dashboard":
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <MainLayout
      user={user}
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={logout}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
