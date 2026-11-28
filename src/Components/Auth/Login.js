// src/Components/Auth/Login.js
import Logo from "../ui/Logo";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import app from "../../Firebase.init";
import { googleSignIn } from "./googleAuth";

const auth = getAuth(app);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!email) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
    return nextErrors;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back.");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 150);
    } catch {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const ok = await googleSignIn(auth, from, "Signed in successfully.");
    setGoogleLoading(false);
    if (ok) navigate(from, { replace: true });
  };

  const inputClass = (field) =>
    `w-full border bg-page-alt py-4 pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none ${
      errors[field]
        ? "border-accent"
        : "border-line focus:border-brand"
    }`;

  return (
    <main className="min-h-screen bg-page pt-[76px] text-ink">
      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 lg:px-10">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-panel2 md:block">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85"
            alt="Traveler sign in"
            className="absolute inset-0 h-full w-full object-cover opacity-46"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/55 to-transparent" />
          <div className="absolute bottom-0 p-10 text-on">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent-lt">
              Client Portal
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Your trips, beautifully organized.
            </h1>
            <p className="mt-5 text-sm leading-7 text-on/68">
              Sign in to continue planning, request bookings, and manage your
              travel conversations.
            </p>
          </div>
        </div>

        <div className="border border-line bg-surface p-7 shadow-sm md:p-10">
          <Link to="/" aria-label="Sababa Tours home" className="mx-auto mb-8 flex w-fit">
            <Logo variant="lockup" className="h-12 w-auto" textClass="text-[30px]" />
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink">
            Welcome Back
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted">
            New here?{" "}
            <Link
              to="/register"
              state={{ from: location.state?.from }}
              className="font-black text-accent"
            >
              Create an account
            </Link>
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-muted">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-accent">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-muted">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`${inputClass("password")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                  aria-label="Toggle password"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-accent">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-green-400 hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-btn px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-brand disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"} <FiArrowRight />
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              or
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center justify-center gap-3 border border-line px-5 py-4 text-sm font-bold transition hover:border-brand disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-muted/30 border-t-brand rounded-full animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <FcGoogle className="text-xl" /> Continue with Google
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
