import GoTrue from "https://esm.sh/gotrue-js@0.9.21";

const API_URL = "https://smileclimb.netlify.app/.netlify/identity";

// ✅ 운영진 5명 이메일로 제한 (반드시 채워!)
const ADMIN_EMAILS = new Set([
  "dlgusqls44@gmail.com",
  "lepleeka137@gmail.com",
  "dusehd1541@gmail.com",
  "john941003@naver.com",
  "wjd2903@gmail.com",
  "migi206@naver.com",
]);

const auth = new GoTrue({ APIUrl: API_URL, setCookie: false });

const loginHandlers = new Set();
const logoutHandlers = new Set();

function $(id) { return document.getElementById(id); }

function show(el, on) {
  if (!el) return;
  el.style.display = on ? "block" : "none";
}

function setMsg(id, text) {
  const el = $(id);
  if (el) el.textContent = text || "";
}

function parseHash() {
  const h = (location.hash || "").replace(/^#/, "");
  const p = new URLSearchParams(h);
  return {
    recovery_token: p.get("recovery_token"),
    invite_token: p.get("invite_token"),
  };
}

function captureHash() {
  const h = location.hash || "";
  if (h.includes("recovery_token") || h.includes("invite_token")) {
    sessionStorage.setItem("auth_hash", h);
  }
}

function reinjectHashIfMissing() {
  const saved = sessionStorage.getItem("auth_hash");
  if (saved && !location.hash) location.hash = saved;
}

function cleanHash() {
  history.replaceState(null, "", location.pathname);
  sessionStorage.removeItem("auth_hash");
}

function isAdminEmail(email) {
  // ✅ ADMIN_EMAILS 비워두면 전부 통과돼버리니, 운영진 이메일을 꼭 넣어라.
  if (ADMIN_EMAILS.size === 0) return true; // 개발중 편의(원하면 false로 바꿔)
  return ADMIN_EMAILS.has((email || "").toLowerCase());
}

function emitLogin(user) {
  for (const cb of loginHandlers) cb(user);
}
function emitLogout() {
  for (const cb of logoutHandlers) cb();
}

function syncPanels() {
  const user = auth.currentUser();
  const { recovery_token } = parseHash();

  // 복구 토큰이면 reset panel 우선
  show($("authResetPanel"), !!recovery_token);
  // 로그인 패널은 유저 없을 때만
  show($("authLoginPanel"), !user && !recovery_token);
}

async function ensureLoggedOut() {
  const u = auth.currentUser();
  if (u) {
    try { await u.logout(); } catch {}
  }
}

export function onLogin(cb) { loginHandlers.add(cb); }
export function onLogout(cb) { logoutHandlers.add(cb); }

export async function initIdentity() {
  // ✅ 토큰 해시 보존 (너가 겪던 "/#"로 날아가는 문제 방지)
  captureHash();
  reinjectHashIfMissing();

  // UI 핸들러 바인딩
  $("btnAuthLogin")?.addEventListener("click", async () => {
    try {
      setMsg("authMsg", "");
      const email = ($("authEmail")?.value || "").trim().toLowerCase();
      const pw = $("authPassword")?.value || "";

      if (!email || !pw) return setMsg("authMsg", "이메일/비밀번호를 입력해줘.");
      await auth.login(email, pw, true);

      const u = auth.currentUser();
      if (!u) throw new Error("로그인 세션 생성 실패");

      if (!isAdminEmail(u.email)) {
        await u.logout();
        emitLogout();
        return setMsg("authMsg", "권한 없음: 운영진 이메일이 아닙니다.");
      }

      emitLogin(u);
      syncPanels();
    } catch (e) {
      console.error(e);
      setMsg("authMsg", "로그인 실패. 이메일/비번 확인.");
    }
  });

  $("btnAuthSendRecovery")?.addEventListener("click", async () => {
    try {
      setMsg("authMsg", "");
      const email = ($("authEmail")?.value || "").trim().toLowerCase();
      if (!email) return setMsg("authMsg", "이메일을 입력해줘.");
      if (!isAdminEmail(email)) return setMsg("authMsg", "권한 없음: 운영진 이메일이 아닙니다.");

      await auth.requestPasswordRecovery(email);
      setMsg("authMsg", "재설정 메일을 보냈어. 메일의 링크로 다시 들어와줘.");
    } catch (e) {
      console.error(e);
      setMsg("authMsg", "메일 발송 실패. 콘솔 확인.");
    }
  });

  $("btnAuthSetPw")?.addEventListener("click", async () => {
    try {
      setMsg("authResetMsg", "");
      const p1 = $("authNewPw")?.value || "";
      const p2 = $("authNewPw2")?.value || "";
      if (p1.length < 8) return setMsg("authResetMsg", "비밀번호는 8자 이상을 추천해.");
      if (p1 !== p2) return setMsg("authResetMsg", "비밀번호가 서로 달라.");

      const u = auth.currentUser();
      if (!u) return setMsg("authResetMsg", "복구 세션이 없어. 재설정 메일 링크로 다시 들어와줘.");

      // ✅ 복구 링크로 들어오면 recover()로 세션 만든 뒤 update로 비번 설정
      await u.update({ password: p1 });

      setMsg("authResetMsg", "비밀번호 설정 완료! 이제 로그인 상태야.");
      // reset 토큰은 URL에서 제거
      cleanHash();

      // 권한 체크
      const u2 = auth.currentUser();
      if (!u2 || !isAdminEmail(u2.email)) {
        if (u2) await u2.logout();
        emitLogout();
        return alert("권한 없음: 운영진 이메일이 아닙니다.");
      }

      emitLogin(u2);
      syncPanels();
    } catch (e) {
      console.error(e);
      setMsg("authResetMsg", "비밀번호 설정 실패. 토큰 만료/오류일 수 있어.");
    }
  });

  $("btnAuthCancelReset")?.addEventListener("click", async () => {
    cleanHash();
    await ensureLoggedOut();
    emitLogout();
    syncPanels();
  });

  // ✅ recovery_token 처리: 링크로 들어오면 여기서 세션 생성
  const { recovery_token, invite_token } = parseHash();

  // 초대 토큰은(위젯 없이) 흐름이 복잡해질 수 있어서,
  // 운영진 5명이라면 "초대 링크" 대신 "비번 재설정 메일"로 세팅하는 걸 추천.
  if (invite_token) {
    // invite token은 일단 제거하고 로그인 패널로 유도
    cleanHash();
  }

  if (recovery_token) {
    // 기존 세션이 남아있으면 꼬이니까 비움
    await ensureLoggedOut();

    try {
      // recover로 복구 세션 생성
      await auth.recover(recovery_token, true);

      // URL은 즉시 정리하지 말고(사용자 입력까지), reset panel은 보여주되
      // 너가 원하면 여기서 cleanHash() 해도 됨.
      // 근데 어떤 환경에서는 recover 직후 hash가 있어야 하는 경우가 있어, 그래서 입력 후에 지우는 걸로.
      syncPanels();
    } catch (e) {
      console.error("recover failed:", e);
      cleanHash();
      setMsg("authMsg", "재설정 링크가 만료되었어. 다시 재설정 메일을 받아줘.");
    }
  }

  // 이미 로그인 상태면 권한 체크 후 반영
  const u = auth.currentUser();
  if (u) {
    if (!isAdminEmail(u.email)) {
      await u.logout();
      emitLogout();
    } else {
      emitLogin(u);
    }
  }

  syncPanels();
}

export function openLogin() {
  // 위젯처럼 모달을 여는 게 아니라, 로그인 패널 표시로 동작
  show($("authLoginPanel"), true);
  $("authEmail")?.focus();
}

export async function logout() {
  const u = auth.currentUser();
  if (u) {
    try { await u.logout(); } catch {}
  }
  emitLogout();
  syncPanels();
}

export async function getFreshJwt() {
  const u = auth.currentUser();
  if (!u) return null;

  // 권한 체크
  if (!isAdminEmail(u.email)) return null;

  // gotrue-js는 tokenDetails().jwt를 제공하는 버전이 많음
  try {
    const td = u.tokenDetails && u.tokenDetails();
    if (td?.jwt) return td.jwt;
  } catch {}

  // fallback: 로컬스토리지에서 토큰 찾기
  const keys = ["gotrue.user", "netlify.auth.user"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const jwt = obj?.token?.access_token || obj?.token?.jwt;
      if (jwt) return jwt;
    } catch {}
  }

  return null;
}
