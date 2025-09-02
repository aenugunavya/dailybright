import { AuthForm } from '@/components/auth/auth-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="soft-card rounded-3xl p-8 soft-shadow-lg">
          <div className="text-center mb-8">
            {/* Smile emoji in top square spot */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-nature-500 to-nature-700 rounded-3xl flex items-center justify-center soft-shadow-lg">
              <div className="text-4xl">😊</div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 font-nunito">Join Daily Bright</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Join our gratitude social network now!
            </p>
          </div>
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
}
