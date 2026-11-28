import Logo from "../ui/Logo";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import {
  FiArrowLeft,
  FiMail,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import app from "../../Firebase.init";

const auth = getAuth(app);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  // Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sendResetEmail = async (isResend = false) => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (isResend) setResendLoading(true);
    else setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      if (!isResend) setSuccess(true);

      setCooldown(60); // 60 second cooldown
      toast.success(
        isResend
          ? "Reset link sent again!"
          : "Password reset link sent to your email!",
      );
    } catch (error) {
      console.error(error);
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
      setResendLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendResetEmail(false);
  };

  return (
    <main className="min-h-screen bg-page pt-[76px] text-ink">
      <div className="max-w-md mx-auto px-6 py-16">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-brand-ink mb-8 hover:gap-3 transition-all"
        >
          <FiArrowLeft /> Back to Sign In
        </Link>

        {!success ? (
          <div className="bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-sm">
          <Link to="/" aria-label="Sababa Tours home" className="mx-auto mb-8 flex w-fit">
            <Logo variant="lockup" className="h-12 w-auto" textClass="text-[30px]" />
          </Link>
            <h2 className="text-4xl font-black tracking-tight mb-2">
              Forgot Password?
            </h2>
            <p className="text-muted mb-8">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-line bg-page-alt py-4 pl-11 pr-4 rounded-2xl focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-btn text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand disabled:opacity-70 transition"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        ) : (
          /* Success State with Resend */
          <div className="bg-surface border border-line rounded-3xl p-10 text-center shadow-sm">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-green-100 rounded-full text-5xl mb-6">
              <FiCheckCircle className="text-brand-ink" />
            </div>

            <h2 className="text-3xl font-black mb-3">Check Your Email</h2>
            <p className="text-muted mb-8 leading-relaxed">
              We've sent a password reset link to <br />
              <strong className="text-ink">{email}</strong>
            </p>

            <div className="space-y-4">
              <button
                onClick={() => sendResetEmail(true)}
                disabled={resendLoading || cooldown > 0}
                className="w-full py-4 border border-line hover:border-brand rounded-2xl font-medium flex items-center justify-center gap-3 transition disabled:opacity-50"
              >
                <FiRefreshCw className={resendLoading ? "animate-spin" : ""} />
                {cooldown > 0
                  ? `Resend again in ${cooldown}s`
                  : "Resend Reset Link"}
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-btn text-white font-black rounded-2xl hover:bg-brand transition"
              >
                Back to Sign In
              </button>
            </div>

            <p className="text-xs text-muted mt-8">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default ForgotPassword;
