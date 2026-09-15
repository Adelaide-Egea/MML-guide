import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Domela — the household guide';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#18241f',
          padding: '72px 80px',
        }}
      >
        <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
          <path d="M13 9 V39" stroke="#eef0ed" strokeWidth="3.8" strokeLinecap="round" />
          <path
            d="M13 9 H25 C34.5 9 39 15.5 39 24 C39 32.5 34.5 39 25 39 H20.5"
            stroke="#eef0ed"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="21" y="21" width="6" height="6" fill="#d9923a" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 68,
              color: '#eef0ed',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Everything you need
          </div>
          <div
            style={{
              fontSize: 68,
              color: '#eef0ed',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            while they are away.
          </div>
          <div style={{ fontSize: 30, color: '#d9923a', marginTop: 28 }}>
            Domela — the household guide
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
