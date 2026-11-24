function Loader({
  message = "Loading...",
  fullScreen = false,
  size = "h-8 w-8",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen" : "py-10"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${size} animate-spin rounded-full border-4 border-slate-200 border-t-blue-600`}
      />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default Loader;
