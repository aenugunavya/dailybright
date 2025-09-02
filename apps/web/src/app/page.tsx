import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-10">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-3 font-nunito">Daily Bright</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Daily gratitude journaling, BeReal-style
          </p>
        </div>

        <div className="soft-card rounded-3xl p-8 soft-shadow-lg">
          {/* Custom logo instead of emoji */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-nature-400 to-nature-600 rounded-3xl flex items-center justify-center soft-shadow-lg">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-foreground font-nunito">
            Share your gratitude moments
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get a daily prompt, share what you're grateful for within your window, 
            and connect with friends' gratitude journeys.
          </p>
          <div className="space-y-4">
            <Link
              href="/signup"
              className="block w-full soft-button bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="block w-full soft-button border border-border hover:bg-accent/10 hover:border-accent text-foreground py-4 px-6 font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="soft-card p-4 hover-lift">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-sm text-muted-foreground font-medium">Daily prompts</p>
          </div>
          <div className="soft-card p-4 hover-lift">
            <div className="text-3xl mb-2">🌅</div>
            <p className="text-sm text-muted-foreground font-medium">Timed windows</p>
          </div>
          <div className="soft-card p-4 hover-lift">
            <div className="text-3xl mb-2">🌿</div>
            <p className="text-sm text-muted-foreground font-medium">Friend circle</p>
          </div>
        </div>
      </div>
    </div>
  );
}