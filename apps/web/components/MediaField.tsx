'use client';

import type { Media } from '@mml/core';
import { useRef, useState } from 'react';
import { newId } from '../lib/ids.ts';
import { deleteBlob, putBlob, readVideoDuration, useMediaUrl } from '../lib/media.ts';

export function MediaThumb({ media }: { media: Media }) {
  const url = useMediaUrl(media.key);
  return (
    <figure className="media-item" style={{ margin: 0 }}>
      {url === null ? (
        <div style={{ aspectRatio: '4 / 3', background: 'var(--surface-sunk)', borderRadius: 'var(--radius-sm)' }} />
      ) : media.kind === 'video' ? (
        <video src={url} controls playsInline preload="metadata" />
      ) : (
        <img src={url} alt={media.caption} />
      )}
      <figcaption>{media.caption}</figcaption>
    </figure>
  );
}

/** Attaching a photo or a short video to an entry.
 *
 *  This is the feature that carries the product across a language barrier: "make the
 *  bed properly" and forty seconds of the bed being made are not the same
 *  instruction. The caption is required rather than optional because it is the only
 *  text the assistant and a screen reader can see.
 */
export function MediaField({
  media,
  onChange,
}: {
  media: readonly Media[];
  onChange: (next: readonly Media[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function attach(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const kind: Media['kind'] = file.type.startsWith('video/') ? 'video' : 'photo';
      const key = `media/${newId('m')}`;
      await putBlob(key, file);
      const durationSeconds = kind === 'video' ? await readVideoDuration(file) : null;
      onChange([...media, { id: newId('med'), kind, key, caption: '', durationSeconds }]);
    } finally {
      setBusy(false);
    }
  }

  function setCaption(id: string, caption: string) {
    onChange(media.map((m) => (m.id === id ? { ...m, caption } : m)));
  }

  function remove(target: Media) {
    void deleteBlob(target.key);
    onChange(media.filter((m) => m.id !== target.id));
  }

  return (
    <div className="stack-tight">
      {media.map((item) => (
        <div key={item.id} className="card stack-tight" style={{ padding: 'var(--space-3)' }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 96, flex: 'none' }}>
              <MediaThumb media={{ ...item, caption: '' }} />
            </div>
            <div className="grow stack-tight">
              <input
                className="input"
                value={item.caption}
                onChange={(e) => setCaption(item.id, e.target.value)}
                placeholder={item.kind === 'video' ? 'What this shows' : 'What this is a photo of'}
                aria-label="Caption"
              />
              <span className="hint">
                {item.caption.trim()
                  ? item.kind === 'video' && (item.durationSeconds ?? 0) > 180
                    ? 'Over three minutes. Long videos do not get watched — consider splitting it.'
                    : ' '
                  : 'Needed. Without it this is invisible to the assistant and to a screen reader.'}
              </span>
            </div>
            <button type="button" className="btn btn-danger" onClick={() => remove(item)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => void attach(e)}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? 'Adding…' : '+ Photo or video'}
      </button>
    </div>
  );
}
