function Header({
  activeNav = "Dashboard",
  currentUser = null,
  onLogout = () => {},
}) {
  const userName = currentUser?.name || "User";
  const userEmail = currentUser?.email || "";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
          {activeNav}
        </h1>

        <p className="mt-1 text-sm text-slate-500">Manage your Shopify store</p>
      </div>

      {/* User section */}
      <div className="ml-4 flex shrink-0 items-center gap-3 sm:gap-4">
        {/* User information */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{userName}</p>

          {userEmail && (
            <p className="mt-0.5 max-w-48 truncate text-xs text-slate-500">
              {userEmail}
            </p>
          )}
        </div>

        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100"
          aria-label={`User avatar for ${userName}`}
        >
          {initials || "U"}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
