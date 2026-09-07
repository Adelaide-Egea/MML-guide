'use client';

// Photos and video live in IndexedDB, not in the household JSON.
//
// The domain model stores a *key* rather than a URL, deliberately: a guide handed to
// a cleaner must not become a permanently public photo of the inside of someone's
// house. Here the key resolves to a per-session object URL. When this moves to a
// server the same key resolves to a signed URL with an expiry, and no calling code
// changes.

import { useEffect, useState } from 'react';

const DB_NAME = 'care-media';
const STORE = 'blobs';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function putBlob(key: string, blob: Blob): Promise<unknown> {
  return tx('readwrite', (store) => store.put(blob, key));
}

export function getBlob(key: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>('readonly', (store) => store.get(key));
}

export function deleteBlob(key: string): Promise<unknown> {
  return tx('readwrite', (store) => store.delete(key));
}

/** Resolves a storage key to a URL usable in an <img> or <video>.
 *
 *  The object URL is revoked when the component unmounts. Without that, scrolling a
 *  guide with thirty photos leaks thirty blobs for the life of the tab, which on a
 *  three-year-old Android is the difference between usable and not.
 */
export function useMediaUrl(key: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setUrl(null);
      return;
    }
    let revoked = false;
    let created: string | null = null;

    void getBlob(key).then((blob) => {
      if (!blob || revoked) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    });

    return () => {
      revoked = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [key]);

  return url;
}

/** Videos are read for their duration so the model can warn about ones nobody will
 *  watch. Resolves to null rather than rejecting: a missing duration is not a reason
 *  to refuse the upload. */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}
