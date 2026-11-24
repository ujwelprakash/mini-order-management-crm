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
    <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{activeNav}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your Shopify store</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{userName}</p>
          <p className="text-xs text-slate-500">{userEmail}</p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
          aria-label={`User avatar for ${userName}`}
        >
          {initials || "U"}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
