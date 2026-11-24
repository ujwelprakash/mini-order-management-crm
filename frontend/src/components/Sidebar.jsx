const navigation = [
  { name: "Dashboard", icon: "📊" },
  { name: "Orders", icon: "📦" },
];

function Sidebar({ activeNav = "Dashboard", setActiveNav = () => {} }) {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-200 px-7 dark:border-slate-800">
        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
          O
        </div>

        <span className="text-xl font-bold">OrderCRM</span>
      </div>

      {/* Navigation */}
      <div className="px-5 py-7">
        <p className="mb-4 text-xs uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveNav(item.name)}
              aria-current={activeNav === item.name ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                activeNav === item.name
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Store connection */}
      <div className="mt-auto p-5">
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
          <p className="text-sm font-medium">Shopify Store</p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ujwel-test-store
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
