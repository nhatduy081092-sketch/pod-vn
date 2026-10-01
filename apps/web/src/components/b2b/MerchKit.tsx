/**
 * Minh hoạ "bộ merchandise doanh nghiệp" (SVG, không cần ảnh): túi tote, bình giữ nhiệt, cốc, sổ, hộp quà
 * cùng mang 1 logo mẫu – thay bằng ảnh thật trong CMS khi có.
 */
export function MerchKit({ className = "", logo = "LOGO" }: { className?: string; logo?: string }) {
  const Mark = ({ x, y, s = 1, light = false }: { x: number; y: number; s?: number; light?: boolean }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-22" y="-22" width="44" height="44" rx="11" fill="#E4570B" />
      <text y="1" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-sans), sans-serif" fontWeight="700" fontSize="11" fill="#fff" letterSpacing="0.5">
        {logo}
      </text>
      {light && <rect x="-22" y="-22" width="44" height="44" rx="11" fill="#fff" opacity=".08" />}
    </g>
  );
  return (
    <svg viewBox="0 0 600 450" className={className} role="img" aria-label="Bộ quà tặng doanh nghiệp in logo: túi, bình, cốc, sổ, hộp quà">
      <defs>
        <linearGradient id="mk-steel" x1="0" x2="1">
          <stop offset="0" stopColor="#8d9298" />
          <stop offset=".35" stopColor="#e7e9ec" />
          <stop offset=".6" stopColor="#c3c7cc" />
          <stop offset="1" stopColor="#7c8187" />
        </linearGradient>
        <linearGradient id="mk-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".14" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".16" />
        </linearGradient>
        <filter id="mk-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="600" height="450" fill="#efe9df" />
      <rect y="398" width="600" height="52" fill="#e6dfd3" />
      {/* bóng tiếp đất */}
      <g fill="#3b2f25" opacity=".22" filter="url(#mk-blur)">
        <ellipse cx="150" cy="402" rx="120" ry="9" />
        <ellipse cx="440" cy="402" rx="150" ry="9" />
      </g>

      {/* hộp quà kraft phía sau */}
      <g>
        <rect x="318" y="196" width="246" height="204" rx="6" fill="#c8a57a" />
        <rect x="318" y="196" width="246" height="204" rx="6" fill="url(#mk-shade)" />
        <rect x="308" y="180" width="266" height="34" rx="6" fill="#d6b68c" />
        <rect x="430" y="180" width="22" height="220" fill="#8f2f1c" opacity=".85" />
        <text x="520" y="300" textAnchor="middle" fontFamily="var(--font-sans), sans-serif" fontSize="13" fontWeight="600" fill="#5b4330" opacity=".7">
          Thank you
        </text>
      </g>

      {/* túi tote canvas */}
      <g>
        <path d="M88 168 C88 92 212 92 212 168" fill="none" stroke="#d9ccb4" strokeWidth="14" strokeLinecap="round" />
        <path d="M58 166 L242 166 L254 398 L46 398 Z" fill="#ece3d1" />
        <path d="M58 166 L242 166 L254 398 L46 398 Z" fill="url(#mk-shade)" />
        <rect x="58" y="166" width="184" height="14" fill="#000" opacity=".05" />
        <Mark x={150} y={276} s={1.5} />
        <text x="150" y="330" textAnchor="middle" fontFamily="var(--font-sans), sans-serif" fontSize="12" fontWeight="600" fill="#1d1d1f" opacity=".75" letterSpacing="2">
          YOUR BRAND
        </text>
      </g>

      {/* bình giữ nhiệt */}
      <g>
        <rect x="252" y="120" width="58" height="26" rx="6" fill="#2b2f33" />
        <rect x="248" y="142" width="66" height="258" rx="18" fill="url(#mk-steel)" />
        <Mark x={281} y={262} s={0.82} />
      </g>

      {/* cốc sứ */}
      <g>
        <path d="M440 318 C476 318 476 368 440 368" fill="none" stroke="#f4f2ee" strokeWidth="11" />
        <path d="M440 318 C476 318 476 368 440 368" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="11" />
        <rect x="336" y="300" width="108" height="100" rx="12" fill="#f8f7f4" />
        <rect x="336" y="300" width="108" height="100" rx="12" fill="url(#mk-shade)" opacity=".7" />
        <ellipse cx="390" cy="302" rx="54" ry="7" fill="#e3ded6" />
        <Mark x={390} y={352} s={0.9} />
      </g>

      {/* sổ tay đen */}
      <g transform="rotate(-4 520 330)">
        <rect x="470" y="236" width="104" height="164" rx="6" fill="#1f1f22" />
        <rect x="560" y="236" width="6" height="164" fill="#E4570B" opacity=".9" />
        <g opacity=".85">
          <Mark x={518} y={300} s={0.75} />
        </g>
        <rect x="470" y="236" width="104" height="164" rx="6" fill="url(#mk-shade)" opacity=".6" />
      </g>
    </svg>
  );
}
