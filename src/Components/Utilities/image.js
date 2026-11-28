// Package pictures can come from any website, not only Unsplash.
// fixImageUrl turns common "share" links into direct image links, imgProps adds the attributes that make
// most hosts (that block hot-linking by Referer) load the picture, and falls back to a placeholder if it still fails.

export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#dfe7e6"/><g fill="none" stroke="#7f9a97" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><rect x="250" y="200" width="300" height="200" rx="24"/><circle cx="330" cy="270" r="22"/><path d="M262 380l92-84 70 60 54-44 82 68"/></g></svg>`,
  );

export const fixImageUrl = (input) => {
  let s = String(input || "").trim();
  if (!s || s.startsWith("data:") || s.startsWith("blob:") || s.startsWith("/")) return s;
  let m;
  // Google Drive share links
  if ((m = s.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || s.match(/drive\.google\.com\/(?:open|uc)\?[^#]*id=([\w-]+)/))) {
    return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600`;
  }
  // Dropbox share links
  if (/(^|\/\/)(www\.)?dropbox\.com\//i.test(s)) {
    return s.replace(/(www\.)?dropbox\.com/i, "dl.dropboxusercontent.com").replace(/[?&]dl=0/, "").replace(/[?&]raw=1/, "");
  }
  // GitHub "blob" pages
  if ((m = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i))) {
    return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
  }
  // imgur page link (imgur.com/abc123) -> direct image
  if ((m = s.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?!a\/|gallery\/)(\w+)$/i))) {
    return `https://i.imgur.com/${m[1]}.jpg`;
  }
  // http pictures are blocked on an https site
  if (/^http:\/\//i.test(s) && !/^http:\/\/(localhost|127\.)/i.test(s)) s = s.replace(/^http:/i, "https:");
  return s;
};

export const onImgError = (e) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = PLACEHOLDER;
};

/* spread on an <img>: <img {...imgProps(url)} alt="..." /> */
export const imgProps = (url) => ({
  src: fixImageUrl(url),
  referrerPolicy: "no-referrer",
  onError: onImgError,
});
