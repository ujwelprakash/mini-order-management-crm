function ThemeToggle({ theme = "light", toggleTheme = () => {} }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
      {/* <span>{isDark ? "Light mode" : "Dark mode"}</span> */}
    </button>
  );
}

export default ThemeToggle;
