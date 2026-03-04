function parseDates(str) {
  if (!str || !str.trim()) return [];
  return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 31);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function toggleSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  const btn   = document.getElementById('toggleBtn');
  panel?.classList.toggle('open');
  btn?.classList.toggle('open');
}

export function enterNoticeMode() {
  document.body.classList.add('notice-mode');
  const card = document.getElementById('calendarCard');
  if (card) window.scrollTo({ top: card.offsetTop - 20, behavior: 'auto' });
}
export function exitNoticeMode() {
  document.body.classList.remove('notice-mode');
}

export function addSpecialRow(day="", label="", place="") {
  const list = document.getElementById('specialList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'special-row';
  row.innerHTML = `
    <input class="date-input" type="number" placeholder="날짜" min="1" max="31"
      style="border:1.5px solid #ddd;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;outline:none;background:#fafafa;max-width:80px;"
      value="${escapeHtml(day)}"/>
    <input type="text" placeholder="내용 (예: 번개, 대회 참가)"
      style="border:1.5px solid #ddd;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;outline:none;flex:1;background:#fafafa;"
      value="${escapeHtml(label)}"/>
    <input type="text" placeholder="장소 (선택)"
      style="border:1.5px solid #ddd;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;outline:none;flex:1;background:#fafafa;"
      value="${escapeHtml(place)}"/>
    <button class="btn-remove" type="button">×</button>`;
  list.appendChild(row);
}

export function bindSpecialListEvents() {
  const list = document.getElementById('specialList');
  if (!list) return;

  // ✅ 이벤트 위임: 버튼이 안 먹히는 문제를 근본적으로 줄임
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove');
    if (!btn) return;

    const rows = list.querySelectorAll('.special-row');
    const row = btn.closest('.special-row');
    if (!row) return;

    if (rows.length > 1) row.remove();
    else row.querySelectorAll('input').forEach(i => i.value = '');
  });

  document.getElementById('btnAddSpecial')?.addEventListener('click', () => addSpecialRow());
}

export function applyConfigToForm(cfg) {
  document.getElementById('inp-year').value  = cfg.year ?? new Date().getFullYear();
  document.getElementById('inp-month').value = cfg.month ?? (new Date().getMonth() + 1);

  const weekend = cfg.weekend ?? {};
  const weekday = cfg.weekday ?? {};

  document.getElementById('inp-weekend-dates').value = Array.isArray(weekend.dates) ? weekend.dates.join(', ') : '';
  document.getElementById('inp-weekend-time').value  = weekend.time ?? '';
  document.getElementById('inp-weekend-place').value = weekend.place ?? '';

  document.getElementById('inp-weekday-dates').value = Array.isArray(weekday.dates) ? weekday.dates.join(', ') : '';
  document.getElementById('inp-weekday-time').value  = weekday.time ?? '';
  document.getElementById('inp-weekday-place').value = weekday.place ?? '';

  document.getElementById('inp-contact').value = cfg.contact ?? '카카오톡 오픈채팅';
  document.getElementById('inp-hashtag').value = cfg.hashtag ?? '#싱글벙클';

  const list = document.getElementById('specialList');
  list.innerHTML = '';
  const specials = Array.isArray(cfg.specials) ? cfg.specials : [];
  if (specials.length === 0) addSpecialRow();
  else specials.forEach(s => addSpecialRow(s.day ?? '', s.label ?? '', s.place ?? ''));
}

export function buildConfigFromForm() {
  const cfg = {
    year: parseInt(document.getElementById('inp-year').value),
    month: parseInt(document.getElementById('inp-month').value),
    contact: document.getElementById('inp-contact').value.trim(),
    hashtag: document.getElementById('inp-hashtag').value.trim(),
    weekend: {
      dates: parseDates(document.getElementById('inp-weekend-dates').value),
      time: document.getElementById('inp-weekend-time').value.trim(),
      place: document.getElementById('inp-weekend-place').value.trim()
    },
    weekday: {
      dates: parseDates(document.getElementById('inp-weekday-dates').value),
      time: document.getElementById('inp-weekday-time').value.trim(),
      place: document.getElementById('inp-weekday-place').value.trim()
    },
    specials: []
  };

  const list = document.getElementById('specialList');
  list?.querySelectorAll('.special-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const d = parseInt(inputs[0].value);
    const label = (inputs[1].value || '').trim();
    const place = (inputs[2].value || '').trim();
    if (!isNaN(d) && d >= 1 && d <= 31 && label) cfg.specials.push({ day: d, label, place });
  });

  return cfg;
}
