// src/Components/Auth/googleAuth.js
// One place for Google sign-in so Login and Registration behave the same.
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import toast from "react-hot-toast";

// Returns true when the user is signed in (popup), false when not (error / redirecting / closed).
export async function googleSignIn(auth, from, successMsg) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await signInWithPopup(auth, provider);
    toast.success(successMsg);
    return true;
  } catch (err) {
    const code = err?.code || "";
    console.error("Google sign-in error:", code, err);

    // user just closed the popup: nothing to report
    if (code === "auth/popup-closed-by-user" || code === "auth/user-cancelled") return false;

    // popup blocked: fall back to full-page redirect
    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      try {
        sessionStorage.setItem("redirectFrom", from);
        await signInWithRedirect(auth, provider);
      } catch (redirectErr) {
        console.error("Redirect failed:", redirectErr);
        toast.error("Google sign-in failed. Allow popups for this site and try again.");
      }
      return false;
    }

    if (code === "auth/unauthorized-domain") {
      toast.error(
        `"${window.location.hostname}" is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.`,
        { duration: 9000 },
      );
    } else if (code === "auth/network-request-failed") {
      toast.error("Network error. Check your connection and try again.");
    } else if (code === "auth/operation-not-allowed") {
      toast.error("Google sign-in is not enabled in Firebase (Authentication > Sign-in method).");
    } else {
      toast.error(`Google sign-in failed (${code || "unknown"}). Please try again.`);
    }
    return false;
  }
}
