import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-white mb-2">GratiTime</h1>
          <p className="text-muted-foreground text-lg">
            Daily gratitude journaling, BeReal-style
          </p>
        </div>

        <div className="gradient-card rounded-2xl p-8 shadow-2xl">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Share your gratitude moments
          </h2>
          <p className="text-muted-foreground mb-6">
            Get a daily prompt, share what you're grateful for within your window, 
            and connect with friends' gratitude journeys.
          </p>
          <div className="space-y-3">
            <Link
              href="/signup"
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="block w-full border border-border hover:bg-accent/50 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">⏰</div>
            <p className="text-sm text-muted-foreground">Daily prompts</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📱</div>
            <p className="text-sm text-muted-foreground">Timed windows</p>
          </div>
          <div>
            <div className="text-2xl mb-1">👥</div>
            <p className="text-sm text-muted-foreground">Friend circle</p>
          </div>
        </div>
      </div>
    </div>
  );
}