/* 자원봉사자 출석체크 — 구글 시트 저장용 스크립트 (v3)
 * 이 파일 전체를 Apps Script 편집기에 붙여넣고 "웹 앱"으로 배포하면 됨.
 * 시트는 처음 접속 때 자동으로 만들어짐: 명단 / 출석 / 설정
 */
const SHEETS = { people: '명단', att: '출석', cfg: '설정' };
const P_HEAD = ['id', 'cat', 'name', 'group', 'area', 'phone'];
const A_HEAD = ['key', 'date', 'id', 'in', 'out', 'absent', 'memo'];

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name, head) {
  let sh = ss().getSheetByName(name);
  if (!sh) { sh = ss().insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  // 날짜·시각이 자동 변환되지 않도록 항상 텍스트 서식 유지
  sh.getRange(1, 1, sh.getMaxRows(), head.length).setNumberFormat('@');
  return sh;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  // 일부 모바일 브라우저에서 POST가 막히는 경우를 위한 우회 경로
  var payload = e && e.parameter && e.parameter.payload;
  if (payload) return handle(payload);
  return json(getAll());
}

function doPost(e) { return handle(e.postData.contents || '{}'); }

function handle(raw) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const b = JSON.parse(raw);
    switch (b.action) {
      case 'upsertPeople': upsertPeople(b.people || []); break;
      case 'deletePerson': deletePerson(b.id); break;
      case 'upsertAtt': upsertAtt(b.date, b.id, b.record); break;
      case 'setEvent': setEvent(b.event || ''); break;
      case 'replaceAll': replaceAll(b.data || {}); break;
      default: return json({ error: 'unknown action: ' + b.action });
    }
    return json(getAll());
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ---------- 읽기 ---------- */
function getAll() {
  const ps = sheet(SHEETS.people, P_HEAD), as = sheet(SHEETS.att, A_HEAD), cs = sheet(SHEETS.cfg, ['key', 'value']);
  const people = rows(ps).map(r => ({ id: s(r[0]), cat: s(r[1]), name: s(r[2]), group: s(r[3]), area: s(r[4]), phone: s(r[5]) })).filter(p => p.id && p.name);
  const att = {};
  rows(as).forEach(r => {
    const key = String(r[0] || ''); const date = key.indexOf('|') > 0 ? dstr(key.split('|')[0]) : dstr(r[1]); const id = String(r[2] || '').trim(); if (!date || !id) return;
    const rec = {};
    if (s(r[3])) rec.in = s(r[3]);
    if (s(r[4])) rec.out = s(r[4]);
    if (s(r[5]) === 'Y') rec.absent = true;
    if (s(r[6])) rec.memo = s(r[6]);
    if (!Object.keys(rec).length) return;
    (att[date] = att[date] || {})[id] = rec;
  });
  let event = '';
  rows(cs).forEach(r => { if (s(r[0]) === 'event') event = s(r[1]); });
  return { event, people, att, updated: new Date().toISOString() };
}
function rows(sh) { const n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues(); }
function tz() { return ss().getSpreadsheetTimeZone() || 'Asia/Seoul'; }
function isDate(v) { return v && typeof v === 'object' && typeof v.getTime === 'function' && !isNaN(v.getTime()); }
function s(v) {
  if (v === null || v === undefined) return '';
  if (isDate(v)) return Utilities.formatDate(v, tz(), 'HH:mm');
  var t = String(v).trim();
  var m = t.match(/(\d{1,2}):(\d{2})/); if (m && /GMT|\d{4}/.test(t)) return ('0' + m[1]).slice(-2) + ':' + m[2];
  return t;
}
function dstr(v) {
  if (isDate(v)) return Utilities.formatDate(v, tz(), 'yyyy-MM-dd');
  var t = String(v || '').trim();
  var m = t.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
  var d = new Date(t); if (!isNaN(d.getTime())) return Utilities.formatDate(d, tz(), 'yyyy-MM-dd');
  return t;
}

/* ---------- 쓰기 ---------- */
function upsertPeople(list) {
  const sh = sheet(SHEETS.people, P_HEAD), data = rows(sh);
  const idx = {}; data.forEach((r, i) => { idx[s(r[0])] = i + 2; });
  list.forEach(p => {
    const row = [p.id, p.cat || '', p.name || '', p.group || '', p.area || '', p.phone || ''];
    if (idx[p.id]) sh.getRange(idx[p.id], 1, 1, P_HEAD.length).setValues([row]);
    else sh.appendRow(row);
  });
}
function deletePerson(id) {
  const ps = sheet(SHEETS.people, P_HEAD), as = sheet(SHEETS.att, A_HEAD);
  deleteRowsWhere(ps, r => s(r[0]) === id);
  deleteRowsWhere(as, r => s(r[2]) === id);
}
function upsertAtt(date, id, rec) {
  const sh = sheet(SHEETS.att, A_HEAD), key = date + '|' + id, data = rows(sh);
  let at = -1; data.forEach((r, i) => { if (s(r[0]) === key) at = i + 2; });
  if (!rec) { if (at > 0) sh.deleteRow(at); return; }
  const row = [key, date, id, rec.in || '', rec.out || '', rec.absent ? 'Y' : '', rec.memo || ''];
  const r = at > 0 ? at : sh.getLastRow() + 1;
  const rng = sh.getRange(r, 1, 1, A_HEAD.length);
  rng.setNumberFormat('@');
  rng.setValues([row]);
}
function setEvent(v) {
  const sh = sheet(SHEETS.cfg, ['key', 'value']), data = rows(sh);
  let at = -1; data.forEach((r, i) => { if (s(r[0]) === 'event') at = i + 2; });
  if (at > 0) sh.getRange(at, 2).setValue(v); else sh.appendRow(['event', v]);
}
function replaceAll(d) {
  const ps = sheet(SHEETS.people, P_HEAD), as = sheet(SHEETS.att, A_HEAD);
  clearBody(ps); clearBody(as);
  const people = (d.people || []).map(p => [p.id, p.cat || '', p.name || '', p.group || '', p.area || '', p.phone || '']);
  if (people.length) ps.getRange(2, 1, people.length, P_HEAD.length).setNumberFormat('@').setValues(people);
  const att = [];
  Object.keys(d.att || {}).forEach(date => Object.keys(d.att[date]).forEach(id => {
    const r = d.att[date][id] || {}; if (!Object.keys(r).length) return;
    att.push([date + '|' + id, date, id, r.in || '', r.out || '', r.absent ? 'Y' : '', r.memo || '']);
  }));
  if (att.length) { as.getRange(2, 1, att.length, A_HEAD.length).setNumberFormat('@').setValues(att); }
  setEvent(d.event || '');
}
function clearBody(sh) { const n = sh.getLastRow(); if (n > 1) sh.deleteRows(2, n - 1); }
function deleteRowsWhere(sh, pred) {
  const data = rows(sh);
  for (let i = data.length - 1; i >= 0; i--) if (pred(data[i])) sh.deleteRow(i + 2);
}
