export function renderCalendar(cfg) {
  const year  = parseInt(cfg.year);
  const month = parseInt(cfg.month);

  const contact = (cfg.contact ?? '').toString().trim();
  const hashtag = (cfg.hashtag ?? '').toString().trim();

  const weekend = cfg.weekend ?? {};
  const weekday = cfg.weekday ?? {};

  const weekendDates = Array.isArray(weekend.dates) ? weekend.dates : [];
  const weekdayDates = Array.isArray(weekday.dates) ? weekday.dates : [];

  const weekendTime  = (weekend.time ?? '').toString().trim();
  const weekendPlace = (weekend.place ?? '').toString().trim();

  const weekdayTime  = (weekday.time ?? '').toString().trim();
  const weekdayPlace = (weekday.place ?? '').toString().trim();

  const specials = {};
  const specialList = Array.isArray(cfg.specials) ? cfg.specials : [];
  specialList.forEach(item => {
    const d = parseInt(item.day);
    const label = (item.label ?? '').toString().trim();
    const place = (item.place ?? '').toString().trim();
    if (!isNaN(d) && d >= 1 && d <= 31 && label) {
      if (!specials[d]) specials[d] = [];
      specials[d].push({ label, place });
    }
  });

  const hdrLabel = document.getElementById('hdr-label');
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrLabel) hdrLabel.textContent = `${year} Schedule`;
  if (hdrTitle) hdrTitle.innerHTML = `${month}월 <span>정모 일정</span>`;

  const grid = document.getElementById('calGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const today = new Date();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('div');
    e.className = 'cell empty';
    grid.appendChild(e);
  }

  for (let d = 1; d <= lastDate; d++) {
    const dow = (firstDay + d - 1) % 7;
    const cell = document.createElement('div');
    let cls = 'cell';
    if (dow === 0) cls += ' sun';
    if (dow === 6) cls += ' sat';
    const isToday = (today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === d);
    if (isToday) cls += ' today';
    cell.className = cls;

    const num = document.createElement('div');
    num.className = 'date-num';
    num.textContent = d;
    cell.appendChild(num);

    if (weekendDates.includes(d)) {
      const b = document.createElement('div');
      b.className = 'badge weekend';
      b.textContent = '';
      cell.appendChild(b);
    }
    if (weekdayDates.includes(d)) {
      const b = document.createElement('div');
      b.className = 'badge weekday';
      b.textContent = '';
      cell.appendChild(b);
    }

    if (specials[d] && specials[d].length > 0) {
      specials[d].forEach(item => {
        const b = document.createElement('div');
        b.className = 'badge special';
        b.textContent = item.label;
        cell.appendChild(b);
      });
    }

    grid.appendChild(cell);
  }

  const info = document.getElementById('infoSection');
  if (info) {
    info.innerHTML = '';

    if (weekendDates.length > 0) {
      const dateStr = weekendDates.map(d => `${month}/${d}`).join(', ');
      const timeStr = weekendTime || '추후 공지';
      const placeStr = weekendPlace || '추후 공지 (카톡방 확인)';
      info.innerHTML += `
        <div class="info-card green">
          <div class="icon">🧗</div>
          <div class="body">
            <strong>주말 정모 — ${dateStr}</strong>
            <span>⏰ ${timeStr} 집합 &nbsp;|&nbsp; 📍 ${placeStr}</span>
          </div>
        </div>`;
    }

    if (weekdayDates.length > 0) {
      const dateStr = weekdayDates.map(d => `${month}/${d}`).join(', ');
      const timeStr = weekdayTime || '추후 공지';
      const placeStr = weekdayPlace || '추후 공지 (카톡방 확인)';
      info.innerHTML += `
        <div class="info-card orange">
          <div class="icon">🏋️</div>
          <div class="body">
            <strong>평일 정모 — ${dateStr}</strong>
            <span>⏰ ${timeStr} 집합 &nbsp;|&nbsp; 📍 ${placeStr}</span>
          </div>
        </div>`;
    }

    const specialDays = Object.keys(specials).map(k => parseInt(k)).sort((a,b) => a-b);
    if (specialDays.length > 0) {
      const rows = specialDays.map(day => {
        return specials[day].map(v => {
          let line = `<strong>⭐ ${month}/${day} — ${v.label}</strong>`;
          if (v.place) line += `<span>🧗 ${v.place}</span>`;
          return line;
        }).join('');
      }).join('');
      info.innerHTML += `
        <div class="info-card purple">
          <div class="icon">⭐</div>
          <div class="body">${rows}</div>
        </div>`;
    }

    if (weekendDates.length === 0 && weekdayDates.length === 0 && specialDays.length === 0) {
      info.innerHTML = `
        <div class="info-card blue">
          <div class="icon">ℹ️</div>
          <div class="body">
            <strong>일정 안내</strong>
            <span>해당 월 config 파일이 비어있습니다.</span>
          </div>
        </div>`;
    }
  }

  const footer = document.getElementById('footerSection');
  if (footer) {
    footer.innerHTML =
      `<strong>SMILE CLIMBING CREW</strong> &nbsp;|&nbsp; 문의: ${contact || '카카오톡 오픈채팅'} &nbsp;|&nbsp; ${hashtag || '#싱글벙클'}`;
  }
}
