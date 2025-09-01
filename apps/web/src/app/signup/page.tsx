import { AuthForm } from '@/components/auth/auth-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="gradient-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌟</div>
            <h1 className="text-3xl font-bold text-white mb-2">Join GratiTime</h1>
            <p className="text-slate-300 text-lg">
              Start your daily gratitude practice today
            </p>
          </div>
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
}
