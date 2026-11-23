import { readBackup, sameFields, type Entry, type Fields, type Kind } from "./model";

const databaseName = "daily.reflection.v1";
const storeName = "entries";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Read the old value and write its successor inside one transaction, even across browser tabs.
async function transact<T>(mode: IDBTransactionMode, work: (
  store: IDBObjectStore, finish: (value: T) => void, abort: (error: Error) => void,
) => void): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      let result: T;
      let reason: Error | undefined;
      const tx = db.transaction(storeName, mode);
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(reason ?? tx.error ?? new Error("저장을 마치지 못했습니다."));
      work(tx.objectStore(storeName), value => { result = value; }, error => {
        reason = error;
        tx.abort();
      });
    });
  } finally {
    db.close();
  }
}

export function listEntries() {
  return transact<Entry[]>("readonly", (store, finish) => {
    const read = store.getAll();
    read.onsuccess = () => finish(read.result);
  });
}

export class EditConflict extends Error {
  constructor(public current: Entry) {
    super("같은 날짜의 기록이 다른 곳에서 변경되었습니다.");
  }
}

export function saveEntry(kind: Kind, date: string, fields: Fields, expected: number) {
  const id = kind + "/" + date;
  return transact<Entry>("readwrite", (store, finish, abort) => {
    const read = store.get(id);
    read.onsuccess = () => {
      const current = read.result as Entry | undefined;
      if (current && sameFields(kind, current.fields, fields)) {
        finish(current);
        return;
      }
      if (current && current.revision !== expected) {
        abort(new EditConflict(current));
        return;
      }
      const entry = { id, kind, date, fields, revision: (current?.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
      store.put(entry);
      finish(entry);
    };
  });
}

export async function exportEntries() {
  return JSON.stringify({ format: "daily.reflection", version: 1, entries: await listEntries() }, null, 2);
}

export function importEntries(text: string) {
  const incoming = readBackup(text);
  return transact<number>("readwrite", (store, finish, abort) => {
    let added = 0;
    finish(0);
    for (const entry of incoming) {
      const read = store.get(entry.id);
      read.onsuccess = () => {
        const current = read.result as Entry | undefined;
        if (current && !sameFields(entry.kind, current.fields, entry.fields)) {
          abort(new Error(entry.date + "의 기존 글과 내용이 다릅니다. 전체 복원을 취소했습니다."));
          return;
        }
        if (!current) {
          store.add(entry);
          finish(++added);
        }
      };
    }
  });
}
