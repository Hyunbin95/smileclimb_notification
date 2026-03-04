import { loadMonthConfig, ymKey } from "./config-io.js";
import { prevMonth, nextMonth, nowYM } from "./month-nav.js";
import { renderCalendar } from "./calendar-render.js";
import { initIdentity, openLogin, logout, onLogin, onLogout, getFreshJwt } from "./admin-auth.js";
import {
  bindSpecialListEvents,
  applyConfigToForm,
  buildConfigFromForm,
  toggleSettingsPanel,
  enterNoticeMode,
  exitNoticeMode
} from "./admin-form.js";

let view = nowYM();

async function refresh() {
  const cfg = await loadMonthConfig(view.year, view.month);
  renderCalendar(cfg);
  applyConfigToForm(cfg);

  const label = document.getElementById("monthLabel");
  if (label) label.textContent = `${view.year}.${String(view.month).padStart(2, "0")}`;
}

export async function initAdmin() {
  // ✅ 초기엔 설정모드(운영진 페이지니까)
  document.body.classList.remove("notice-mode");

  // month nav
  document.getElementById("btnPrev")?.addEventListener("click", async () => {
    view = prevMonth(view.year, view.month);
    await refresh();
  });
  document.getElementById("btnNext")?.addEventListener("click", async () => {
    view = nextMonth(view.year, view.month);
    await refresh();
  });

  // settings panel toggle
  document.getElementById("toggleBtn")?.addEventListener("click", toggleSettingsPanel);

  // notice mode buttons
  document.getElementById("btnEnterNotice")?.addEventListener("click", enterNoticeMode);
  document.getElementById("btnExitNotice")?.addEventListener("click", exitNoticeMode);

  // special list events
  bindSpecialListEvents();

  // identity
  initIdentity();
  document.getElementById("btnLogin")?.addEventListener("click", openLogin);
  document.getElementById("btnLogout")?.addEventListener("click", logout);

  const emailEl = document.getElementById("adminEmail");
  const setLoggedInUI = (email) => {
    if (emailEl) emailEl.textContent = email || "";
  };

  onLogin((user) => setLoggedInUI(user?.email || ""));
  onLogout(() => setLoggedInUI(""));

  // preview
  document.getElementById("btnPreview")?.addEventListener("click", () => {
    const cfg = buildConfigFromForm();
    renderCalendar(cfg);
    document.getElementById('calendarCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // apply(commit)
  document.getElementById("btnApply")?.addEventListener("click", async () => {
    const jwt = await getFreshJwt();
    if (!jwt) return alert("로그인 후 적용할 수 있어요.");

    const config = buildConfigFromForm();
    const ym = ymKey(config.year, config.month);

    const res = await fetch("/.netlify/functions/update-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwt
      },
      body: JSON.stringify({
        ym,          // ✅ 서버가 configs/{ym}.json을 수정하도록
        config,
        message: `Update schedule: ${ym} via admin.html`
      })
    });

    if (!res.ok) {
      const t = await res.text();
      return alert(`커밋 실패: ${res.status}\n${t}`);
    }
    alert("적용 완료! 배포 반영까지 잠시 후 자동 반영됩니다.");
  });

  // "달력 생성하기" 버튼(폼->렌더만)
  document.getElementById("btnGenerate")?.addEventListener("click", () => {
    const cfg = buildConfigFromForm();
    renderCalendar(cfg);
    document.getElementById('calendarCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  await refresh();
}
