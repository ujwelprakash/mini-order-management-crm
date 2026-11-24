import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import useTheme from "../hooks/useTheme";

function MainLayout({
  children,
  activePage = "Dashboard",
  setActivePage = () => {},
  user,
  onLogout,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-white">
      <Sidebar activeNav={activePage} setActiveNav={setActivePage} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 md:px-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {activePage}
            </h1>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage your Shopify store
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 bg-slate-50 p-5 transition-colors dark:bg-slate-950 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
