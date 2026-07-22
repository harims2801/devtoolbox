export function LoadingView() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="bg-muted h-4 w-28 animate-pulse rounded motion-reduce:animate-none" />
      <div className="bg-muted mt-5 h-10 max-w-xl animate-pulse rounded motion-reduce:animate-none" />
      <div className="bg-muted mt-4 h-5 max-w-2xl animate-pulse rounded motion-reduce:animate-none" />
      <span className="sr-only">Loading</span>
    </main>
  );
}
