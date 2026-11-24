import { useEffect, useState } from "react";

function Settings() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("authUser") || "null");

      setUser(storedUser);
      setProfileName(storedUser?.name || "");
      setProfileEmail(storedUser?.email || "");
    } catch {
      setUser(null);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setMessage("");

    if (!profileName.trim() || !profileEmail.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!user) {
      setMessage("User information could not be loaded.");
      return;
    }

    const updatedUser = {
      ...user,
      name: profileName.trim(),
      email: profileEmail.trim(),
    };

    localStorage.setItem("authUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setMessage("Profile updated locally.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Information
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your account details.
        </p>

        <form onSubmit={handleSave} className="mt-6 max-w-xl space-y-5">
          {message && (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {message}
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Account Information
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Account Status
            </p>
            <p className="mt-1 text-sm font-medium text-green-600">Active</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Authentication
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              JWT Authentication
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Settings;
