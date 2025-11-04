export const runtime = "edge";
export const dynamic = "error";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-muted-foreground">
          Some features are unavailable without an internet connection. Please
          reconnect to continue.
        </p>
        <div className="text-sm text-muted-foreground">PWA offline fallback</div>
      </div>
    </main>
  );
}
