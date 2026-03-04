export function initIdentity() {
  if (!window.netlifyIdentity) throw new Error("Netlify Identity 위젯이 로드되지 않았습니다.");
  window.netlifyIdentity.init();
}

export function openLogin() {
  window.netlifyIdentity?.open("login");
}

export async function logout() {
  await window.netlifyIdentity?.logout();
}

export function onLogin(cb) {
  window.netlifyIdentity?.on("login", cb);
}

export function onLogout(cb) {
  window.netlifyIdentity?.on("logout", cb);
}

export async function getFreshJwt() {
  const u = window.netlifyIdentity?.currentUser();
  if (!u) return null;
  return await u.jwt(true);
}
