import { useId } from 'react';

// Small illustrated avatars, generated in SVG. No photos, so no real faces (AGENTS.md rule 4).

const SKIN = ['#f6d3b3', '#ebb98f', '#d49a6a', '#a86b42', '#7a4a2b'];
const HAIR = ['#2b2321', '#4a3426', '#8a5a35', '#c98e4e', '#55556b', '#b5523b'];
const BG = ['#eceff1', '#fbe9ec', '#f6eee6', '#e7eff5', '#f1ecf4', '#e8f3ec'];
// Everyone dresses in Scarlet and Gray.
const SHIRT = ['#ba0c2f', '#a7b1b7', '#3f4443', '#8c0a24', '#6e7a82', '#d4163c'];
const STYLES = ['short', 'long', 'curly', 'bun', 'buzz', 'bob'];

// Hand-picked looks for the sample cast, so the demo has variety. Anyone else gets a hashed look.
const LOOKS = {
  'u-riley': [1, 1, 'short', 0, 1],
  'u-leila': [2, 0, 'long', 3, 4],
  'u-amara': [4, 0, 'curly', 2, 2],
  'u-diego': [2, 0, 'short', 1, 0],
  'u-hannah': [0, 0, 'bun', 4, 1],
  'u-marcus': [3, 0, 'buzz', 5, 5],
  'u-priya': [2, 0, 'long', 0, 3],
  'u-sam': [0, 3, 'short', 2, 0],
  'u-theo': [1, 2, 'curly', 3, 2],
  'u-nia': [4, 0, 'bun', 1, 4],
  'u-grace': [0, 0, 'bob', 5, 0],
  'u-elena': [0, 5, 'long', 4, 5],
  'u-osei': [4, 4, 'buzz', 0, 3],
};

function hash(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function lookFor(id = '') {
  const [skin, hair, style, bg, shirt] = LOOKS[id] ?? (() => {
    const h = hash(id);
    return [h % SKIN.length, (h >>> 3) % HAIR.length, STYLES[(h >>> 6) % STYLES.length], (h >>> 9) % BG.length, (h >>> 12) % SHIRT.length];
  })();
  return { skin: SKIN[skin], hair: HAIR[hair], style, bg: BG[bg], shirt: SHIRT[shirt] };
}

function BackHair({ style, color }) {
  if (style === 'long') return <path d="M11 18.5c0-7 4-11 9-11s9 4 9 11v13H11z" fill={color} />;
  if (style === 'bob') return <path d="M11.4 18.5c0-6.6 3.8-10.6 8.6-10.6s8.6 4 8.6 10.6v6.5H11.4z" fill={color} />;
  return null;
}

function FrontHair({ style, color }) {
  switch (style) {
    case 'long':
    case 'bob':
      return <path d="M12.3 16.8c.3-5.1 3.5-8.4 7.7-8.4s7.4 3.3 7.7 8.4c-3.3-.6-6.5-2.4-8.5-5.1-1.4 2.5-3.9 4.3-6.9 5.1z" fill={color} />;
    case 'curly':
      return (
        <g fill={color}>
          {[
            [13, 14.2],
            [14.6, 11],
            [17.6, 9.2],
            [21, 8.9],
            [24.4, 10.2],
            [26.6, 13],
            [27.3, 15.8],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.3" />
          ))}
        </g>
      );
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="20" cy="7.4" r="3.6" />
          <path d="M12.4 17c0-5.4 3.4-8.6 7.6-8.6s7.6 3.2 7.6 8.6c-2-2.8-4.6-4.2-7.6-4.2s-5.6 1.4-7.6 4.2z" />
        </g>
      );
    case 'buzz':
      return <path d="M12.6 16.2c.4-4.8 3.4-7.6 7.4-7.6s7 2.8 7.4 7.6c-2.2-1.8-4.6-2.6-7.4-2.6s-5.2.8-7.4 2.6z" fill={color} opacity="0.92" />;
    default:
      return <path d="M12.3 17.4c-.4-6 3.2-9.5 7.7-9.5s8.1 3.5 7.7 9.5c-1.6-3-4.3-4.6-7.7-4.6s-6.1 1.6-7.7 4.6z" fill={color} />;
  }
}

export function Avatar({ user, size = 32, className = '' }) {
  const clipId = useId();
  const look = lookFor(user?.id);
  const name = user?.name ?? 'Unknown user';
  return (
    <svg className={`avatar ${className}`} width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={name}>
      <title>{name}</title>
      <clipPath id={clipId}>
        <circle cx="20" cy="20" r="20" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="40" height="40" fill={look.bg} />
        <BackHair style={look.style} color={look.hair} />
        <path d="M6.5 41c.4-6.8 6.2-11.4 13.5-11.4S33.1 34.2 33.5 41z" fill={look.shirt} />
        <rect x="17.2" y="23.8" width="5.6" height="7" rx="2.2" fill={look.skin} />
        <ellipse cx="12.7" cy="19.2" rx="1.4" ry="1.9" fill={look.skin} />
        <ellipse cx="27.3" cy="19.2" rx="1.4" ry="1.9" fill={look.skin} />
        <ellipse cx="20" cy="18.4" rx="7.4" ry="8.4" fill={look.skin} />
        <FrontHair style={look.style} color={look.hair} />
        <circle cx="17.2" cy="19" r="0.95" fill="#2b2321" />
        <circle cx="22.8" cy="19" r="0.95" fill="#2b2321" />
        <path d="M17.7 22.4q2.3 1.8 4.6 0" stroke="#8a3f2c" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function AvatarStack({ users, size = 32, max = 3 }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="avatar-stack" style={{ '--avatar-size': `${size}px` }}>
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} />
      ))}
      {extra > 0 && (
        <span className="avatar-more" aria-label={`${extra} more`}>
          +{extra}
        </span>
      )}
    </span>
  );
}
