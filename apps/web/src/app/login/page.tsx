import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="soft-card rounded-3xl p-8 soft-shadow-lg">
          <div className="text-center mb-8">
            {/* Green leaf logo instead of emoji */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-nature-400 to-nature-600 rounded-3xl flex items-center justify-center soft-shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 font-nunito">Welcome Back to Daily Bright!</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Sign in to continue your gratitude journey
            </p>
          </div>
          <AuthForm mode="signin" />
        </div>
      </div>
    </div>
  )
}
