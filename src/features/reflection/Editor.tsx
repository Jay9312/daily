import { useState } from "react";
import { questions, hasText, sameFields, validFields, type Kind, type Entry, type Fields } from "./model";
import { EditConflict, saveEntry } from "./store";

interface Draft { fields: Fields; base: number }

function readDraft(key: string, kind: Kind): Draft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return draft && Number.isSafeInteger(draft.base) && draft.base >= 0 && validFields(kind, draft.fields) ? draft : null;
  } catch { return null; }
}

export function Editor({ kind, date, entry, onSave }: {
  kind: Kind; date: string; entry?: Entry; onSave: (entry: Entry) => void;
}) {
  const key = "daily.reflection.draft/" + kind + "/" + date;
  const [draft, setDraft] = useState<Draft | null>(() => readDraft(key, kind));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<Entry | null>(null);
  const fields = draft?.fields ?? entry?.fields ?? {};
  const stored = entry?.fields ?? {};
  const dirty = !!draft && (hasText(fields) || hasText(stored)) && !sameFields(kind, fields, stored);

  function change(next: Draft) {
    setMessage("");
    setDraft(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); }
    catch { setMessage("임시 보관을 사용할 수 없습니다. 이 화면을 떠나기 전에 저장하세요."); }
  }

  function clearDraft() {
    setDraft(null);
    setConflict(null);
    try { sessionStorage.removeItem(key); } catch { /* The saved record is in IndexedDB. */ }
  }

  async function save() {
    if (!draft || busy) return;
    if (!hasText(fields) && !window.confirm("이 날짜에 저장된 글을 모두 비울까요?")) return;
    setBusy(true);
    try {
      const saved = await saveEntry(kind, date, fields, draft.base);
      onSave(saved);
      clearDraft();
      setMessage("이 브라우저에 저장했습니다.");
    } catch (error) {
      if (error instanceof EditConflict) setConflict(error.current);
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  return <section className="rf-editor" aria-label={kind === "day" ? "하루 기록 작성" : "주간 회고 작성"}>
    {questions[kind].map(([id, label, question]) => <label className="rf-field" key={id}>
      <span className="rf-label">{label}</span>
      <span className="rf-question">{question}</span>
      <textarea aria-label={label} rows={id === "body" ? 5 : 2} value={fields[id] ?? ""} disabled={busy}
        onChange={event => change({ base: draft?.base ?? entry?.revision ?? 0, fields: { ...fields, [id]: event.target.value } })} />
    </label>)}
    {conflict && <div className="rf-conflict">
      <strong>다른 곳에서 저장한 글</strong>
      {questions[kind].filter(([id]) => conflict.fields[id]).map(([id, label]) =>
        <p key={id}><b>{label}</b><br />{conflict.fields[id]}</p>)}
      {!hasText(conflict.fields) && <p>비운 기록입니다.</p>}
      <p>위 글과 내 초안을 비교한 뒤 사용할 쪽을 선택하세요.</p>
      <button onClick={() => { onSave(conflict); clearDraft(); setMessage("다른 곳에서 저장한 글을 열었습니다."); }}>저장된 글 열기</button>
      <button onClick={() => { change({ fields, base: conflict.revision }); onSave(conflict); setConflict(null); }}>내 초안으로 수정 계속</button>
    </div>}
    <div className="rf-save">
      <span role="status">{message || (dirty ? "저장 전 초안" : hasText(fields) ? "저장된 기록" : "원하는 항목만 작성하세요.")}</span>
      <button className="rf-primary" onClick={save} disabled={busy || !dirty || !!conflict}>{busy ? "저장 중" : "기록 저장"}</button>
    </div>
  </section>;
}
