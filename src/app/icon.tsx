import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 9,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
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
