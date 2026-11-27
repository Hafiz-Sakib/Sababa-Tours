// src/Components/Utilities/authFetch.js
// fetch() wrapper that attaches the Firebase ID token so the backend can
// verify who the user is. Throws "NOT_LOGGED_IN" if nobody is signed in.
import { auth } from "../../Firebase.init";

export const authFetch = async (url, options = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_LOGGED_IN");
  const token = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
};
