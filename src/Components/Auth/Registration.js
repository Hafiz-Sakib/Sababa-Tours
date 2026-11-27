// src/Components/Auth/Registration.js
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";
import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiX,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import app from "../../Firebase.init";

const auth = getAuth(app);

const Rule = ({ met, label }) => (
  <li
    className={`flex items-center gap-2 text-xs font-bold ${met ? "text-lagoon-ink" : "text-muted"}`}
  >
    {met ? <FiCheck /> : <FiX />} {label}
  </li>
);

const Registration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Full name is required.";
    if (!email) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      nextErrors.email = "Enter a valid email.";
    if (!Object.values(rules).every(Boolean))
      nextErrors.password = "Password does not meet requirements.";
    if (confirm !== password) nextErrors.confirm = "Passwords do not match.";
    return nextErrors;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(user, { displayName: name });
      toast.success("Account created. Welcome to Sababa Tours.");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(
        error.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Google Sign-Up Success:", result.user.email);
      toast.success("Account ready. Welcome!");
      navigate(from, { replace: true });
    } catch (popupError) {
      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/cancelled-popup-request"
      ) {
        try {
          sessionStorage.setItem("redirectFrom", from);
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("Redirect failed:", redirectError);
          toast.error("Google sign-up failed.");
          setGoogleLoading(false);
        }
      } else {
        console.error("Google sign-up error:", popupError);
        toast.error("Google sign-up failed. Please try again.");
        setGoogleLoading(false);
      }
    }
  };

  const inputClass = (field) =>
    `w-full border bg-page-alt py-4 pl-11 pr-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none ${
      errors[field]
        ? "border-coral"
        : "border-line focus:border-lagoon"
    }`;

  return (
    <main className="min-h-screen bg-page pt-[76px] text-ink">
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-16 md:grid-cols-2 lg:px-10">
        <div className="relative hidden min-h-[720px] overflow-hidden bg-panel2 md:block">
          <img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=85"
            alt="Create travel account"
            className="absolute inset-0 h-full w-full object-cover opacity-48"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f4c76b]">
              Start Planning
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Your next journey deserves a better desk.
            </h1>
            <p className="mt-5 text-sm leading-7 text-white/68">
              Create an account to request trips and keep your planning
              conversations in one place.
            </p>
          </div>
        </div>

        <div className="border border-line bg-surface p-7 shadow-sm md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lagoon-ink">
            Create Account
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Join Sababa Tours
          </h2>
          <p className="mt-2 text-sm text-muted">
            Already registered?{" "}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="font-black text-coral"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5" noValidate>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-muted">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className={inputClass("name")}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-xs font-bold text-coral">
                  {errors.name}
                </p>
              )}
            </div>

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
                <p className="mt-2 text-xs font-bold text-coral">
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
              <ul className="mt-3 grid gap-2 border border-line bg-page-alt p-4 sm:grid-cols-2">
                <Rule met={rules.length} label="8 characters" />
                <Rule met={rules.upper} label="Uppercase" />
                <Rule met={rules.lower} label="Lowercase" />
                <Rule met={rules.number} label="Number" />
              </ul>
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-coral">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-muted">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={inputClass("confirm")}
                />
              </div>
              {errors.confirm && (
                <p className="mt-2 text-xs font-bold text-coral">
                  {errors.confirm}
                </p>
              )}
            </div>

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-btn px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-lagoon disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"} <FiArrowRight />
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
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="flex items-center justify-center gap-3 border border-line px-5 py-4 text-sm font-bold transition hover:border-lagoon disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-muted/30 border-t-lagoon rounded-full animate-spin" />
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

export default Registration;
