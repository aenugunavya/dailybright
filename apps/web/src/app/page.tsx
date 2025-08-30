import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GratiTime</h1>
          <p className="text-gray-600">
            Daily gratitude journaling, BeReal-style
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-xl font-semibold mb-4">
            Share your gratitude moments
          </h2>
          <p className="text-gray-600 mb-6">
            Get a daily prompt, share what you're grateful for within your window, 
            and connect with friends' gratitude journeys.
          </p>
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">⏰</div>
            <p className="text-sm text-gray-600">Daily prompts</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📱</div>
            <p className="text-sm text-gray-600">Timed windows</p>
          </div>
          <div>
            <div className="text-2xl mb-1">👥</div>
            <p className="text-sm text-gray-600">Friend circle</p>
          </div>
        </div>
      </div>
    </div>
  );
}