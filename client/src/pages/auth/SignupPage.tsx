import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// ══════════════════════════════════════════════════════════════
// Signup Page — new account registraton
//
// includes real-time password strength indicater because
// nobody likes finding out their pasword is too weak AFTER
// they've already typed it and hit submit
//
// also has a name field becuase we're building a team tool
// — anonymous accounts dont make much sense here lol
// ══════════════════════════════════════════════════════════════

// password rules — shown as a checklist below the password field
const passwordRules = [
  { label: "At least 8 charecters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase leter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase leter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One numbr", test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // check all password rules in realtime
  const passedRules = passwordRules.filter((rule) => rule.test(password));
  const allRulesPassed = passedRules.length === passwordRules.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // client-side validaton before hitting the API
    if (!allRulesPassed) {
      setError("Please meet all password requirments");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({ name, email, password });

      // auto-login after registraton — no need to make them sign in again
      login(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      );

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Registration faild — try again";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      {/* background blobs — same style as login for consistancy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 dark:bg-white mb-4">
            <span className="text-white dark:text-zinc-900 font-bold text-lg">E</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Create your account
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Start managing your team's tasks today
          </p>
        </div>

        <Card className="border-zinc-200/80 shadow-lg shadow-zinc-200/50 dark:border-zinc-800 dark:shadow-none backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign Up</CardTitle>
            <CardDescription>
              Fill in your detials to get started
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* error alert */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}

              {/* name field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Gaurav Thakur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                  disabled={isLoading}
                  minLength={2}
                />
              </div>

              {/* email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* password field with strength checker */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* password strength indicator — real-time checklist */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {/* progress bar — fills up as rules are met */}
                    <div className="flex gap-1">
                      {passwordRules.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passedRules.length
                              ? passedRules.length <= 2
                                ? "bg-red-400"
                                : passedRules.length === 3
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* individual rule status */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {passwordRules.map((rule, i) => {
                        const passed = rule.test(password);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              passed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {passed ? (
                              <Check size={12} className="shrink-0" />
                            ) : (
                              <X size={12} className="shrink-0" />
                            )}
                            {rule.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || !allRulesPassed}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              <p className="text-sm text-zinc-500 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
