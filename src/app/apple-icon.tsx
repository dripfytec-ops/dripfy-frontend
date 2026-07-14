import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            background: 'white',
            borderRadius: '0 60% 60% 60%',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
