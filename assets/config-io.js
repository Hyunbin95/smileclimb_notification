export function ymKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function loadMonthConfig(year, month) {
  const ym = ymKey(year, month);
  const res = await fetch(`./configs/${ym}.json?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`config load failed: ${res.status} (${ym})`);
  return await res.json();
}
