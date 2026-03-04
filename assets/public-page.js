import { loadMonthConfig } from "./config-io.js";
import { prevMonth, nextMonth, nowYM } from "./month-nav.js";
import { renderCalendar } from "./calendar-render.js";

let view = nowYM();

async function refresh() {
  const cfg = await loadMonthConfig(view.year, view.month);
  renderCalendar(cfg);

  const label = document.getElementById("monthLabel");
  if (label) label.textContent = `${view.year}.${String(view.month).padStart(2, "0")}`;
}

export async function initPublic() {
  document.body.classList.add("notice-mode"); // 공개용은 무조건 공지모드

  document.getElementById("btnPrev")?.addEventListener("click", async () => {
    view = prevMonth(view.year, view.month);
    await refresh();
  });

  document.getElementById("btnNext")?.addEventListener("click", async () => {
    view = nextMonth(view.year, view.month);
    await refresh();
  });

  await refresh();
}
