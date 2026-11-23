import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";
import { formatKoreanFullDate, getLocalDateKey } from "../../domain/date";
import { Editor } from "./Editor";
import { hasText, localNoon, monday, questions, shiftDate, validDate, type Entry, type Kind } from "./model";
import { exportEntries, importEntries, listEntries } from "./store";
import "./reflection.css";

const shortDate = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" });
const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

function Backup({ refresh }: { refresh: () => void }) {
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function download() {
    try {
      const content = await exportEntries();
      const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "daily-reflection-" + getLocalDateKey() + ".json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setStatus("백업 파일을 만들지 못했습니다."); }
  }

  async function restore(file: File) {
    try {
      const count = await importEntries(await file.text());
      setStatus(count + "건을 추가했습니다. 같은 기록은 건너뛰었습니다.");
      refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "복원하지 못했습니다."); }
  }

  return <details className="rf-backup">
    <summary>성찰 기록 백업과 복원</summary>
    <p>이 브라우저에 저장한 하루 기록과 주간 회고를 JSON 파일로 옮길 수 있습니다. 초안은 저장한 뒤 백업하세요.</p>
    <div className="rf-buttons"><button onClick={download}>백업 받기</button><button onClick={() => input.current?.click()}>백업 복원</button></div>
    <input ref={input} type="file" accept=".json,application/json" hidden aria-label="성찰 백업 파일"
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void restore(file); }} />
    <p role="status">{status}</p>
  </details>;
}

export function ReflectionScreen({ initialDate }: { initialDate?: string }) {
  const today = getLocalDateKey();
  const [date, setDate] = useState(validDate(initialDate) && initialDate <= today ? initialDate : today);
  const [kind, setKind] = useState<Kind>("day");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const records = await listEntries();
      if (request === generation.current) { setEntries(records); setError(""); }
    } catch {
      if (request === generation.current) setError("이 브라우저의 기록을 열지 못했습니다. 저장 공간 접근을 확인한 뒤 다시 시도하세요.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { generation.current++; window.removeEventListener("focus", refresh); };
  }, [refresh]);

  function saved(record: Entry) {
    ++generation.current;
    setEntries(current => [...(current ?? []).filter(entry => entry.id !== record.id), record]);
    void refresh();
  }

  const start = monday(date);
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
  const byId = new Map((entries ?? []).map(entry => [entry.id, entry]));
  const daysWithNotes = days.filter(day => hasText(byId.get("day/" + day)?.fields ?? {}));
  const anchor = kind === "day" ? date : start;
  const entry = byId.get(kind + "/" + anchor);
  const history = (entries ?? []).filter(item => item.kind === kind && hasText(item.fields))
    .sort((a, b) => b.date.localeCompare(a.date));
  const step = kind === "day" ? 1 : 7;
  const next = shiftDate(date, step);
  const canGoForward = kind === "day" ? date < today : start < monday(today);

  return <div className="reflection">
    <div className="rf-switch" aria-label="성찰 보기">
      {(["day", "week"] as const).map(mode => <button key={mode} aria-pressed={kind === mode}
        onClick={() => setKind(mode)}>{mode === "day" ? "하루 기록" : "주간 회고"}</button>)}
    </div>
    <div className="rf-date-panel">
      <div className="rf-nav">
        <div><div className="rf-kicker"><NotebookPen size={15} aria-hidden="true" />{kind === "day" ? "하루 기록" : "주간 회고"}</div>
          <h2>{kind === "day" ? formatKoreanFullDate(localNoon(date)) : shortDate.format(localNoon(start)) + " – " + shortDate.format(localNoon(days[6]))}</h2></div>
        <div className="rf-arrows"><button aria-label="이전 기간" onClick={() => setDate(shiftDate(date, -step))}><ChevronLeft /></button>
          <button aria-label="다음 기간" disabled={!canGoForward} onClick={() => setDate(next > today ? today : next)}><ChevronRight /></button></div>
      </div>
      <div className="rf-weekstrip">{days.map((day, index) => {
        const recorded = daysWithNotes.includes(day);
        return <button key={day} data-active={kind === "day" && date === day} disabled={day > today}
          aria-label={day + (recorded ? " 기록 있음" : " 기록 없음")} aria-pressed={kind === "day" && date === day}
          onClick={() => { setDate(day); setKind("day"); }}>
          <span>{weekDays[index]}</span><b>{localNoon(day).getDate()}</b><i data-recorded={recorded} /></button>;
      })}</div>
      <div className="rf-date-line">
        <label>날짜 이동 <input type="date" aria-label="날짜 이동" value={date} max={today}
          onChange={event => { const key = event.target.value; if (validDate(key) && key <= today) setDate(key); }} /></label>
        <button onClick={() => setDate(today)}>오늘</button>
      </div>
    </div>
    {error && <div role="alert">{error} <button onClick={refresh}>다시 시도</button></div>}
    {entries === null && !error && <p role="status">기록을 여는 중입니다.</p>}
    {entries !== null && <>
      {kind === "week" && <section className="rf-sources">
        <h3>이번 주에 쓴 글 <small>{daysWithNotes.length}일 / 7일</small></h3>
        {daysWithNotes.length === 0 && <p>이번 주 하루 기록이 비어 있습니다. 회고부터 시작해도 좋습니다.</p>}
        {daysWithNotes.map(day => {
          const fields = byId.get("day/" + day)!.fields;
          return <details key={day}><summary>{shortDate.format(localNoon(day))} <span>{fields.action || fields.body || Object.values(fields).find(value => value.trim())}</span></summary>
            {questions.day.filter(([id]) => fields[id]?.trim()).map(([id, label]) =>
              <p key={id}><b>{label}</b><br />{fields[id]}</p>)}
          </details>;
        })}
      </section>}
      <Editor key={kind + "/" + anchor} kind={kind} date={anchor} entry={entry} onSave={saved} />
      <details className="rf-history"><summary>{kind === "day" ? "저장한 하루 기록" : "저장한 주간 회고"} · {history.length}건</summary>
        {history.length ? <ul>{history.map(item => <li key={item.id}><button onClick={() => { setDate(item.date); window.scrollTo(0, 0); }}>
          <b>{item.date}</b> <span>{(item.fields.action || item.fields.pattern || item.fields.body || Object.values(item.fields).find(x => x.trim()))?.slice(0, 54)}</span>
        </button></li>)}</ul> : <p>아직 저장한 글이 없습니다.</p>}
      </details>
      <Backup refresh={refresh} />
    </>}
    <p className="rf-scope">이 브라우저에 보관됩니다. 기기 간 이동은 성찰 백업을 이용하세요.</p>
  </div>;
}
