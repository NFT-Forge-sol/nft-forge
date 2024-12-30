const ForgeLogo = () => (
  <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Particles */}
    <rect x="380" y="140" width="16" height="16" fill="#FF6B00" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
    </rect>
    <rect x="420" y="180" width="16" height="16" fill="#FF6B00" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
    </rect>
    <rect x="350" y="200" width="16" height="16" fill="#FF6B00" opacity="0.8">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite" />
    </rect>

    {/* Anvil */}
    <path d="M100 300h312v48H100z" fill="#1A1A1A" />
    <path d="M140 348h232v32H140z" fill="#0A0A0A" />
    <path d="M180 380h152v32H180z" fill="#1A1A1A" />

    {/* Hammer */}
    <g transform="rotate(-45 320 200)">
      <rect x="240" y="120" width="40" height="120" fill="#FF6B00" />
      <rect x="220" y="80" width="80" height="40" fill="#FF8533" />
      <animate
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="-45 320 200"
        to="-30 320 200"
        dur="0.5s"
        repeatCount="indefinite"
        additive="sum"
        calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
        values="-45 320 200;-30 320 200;-45 320 200"
      />
    </g>

    {/* Impact Particles */}
    <g>
      <rect x="280" y="320" width="8" height="8" fill="#FF6B00" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        <animate attributeName="transform" type="translate" values="0,0; -20,-20" dur="0.5s" repeatCount="indefinite" />
      </rect>
      <rect x="290" y="330" width="8" height="8" fill="#FF6B00" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        <animate attributeName="transform" type="translate" values="0,0; 20,-20" dur="0.5s" repeatCount="indefinite" />
      </rect>
      <rect x="270" y="325" width="8" height="8" fill="#FF6B00" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        <animate attributeName="transform" type="translate" values="0,0; -10,-30" dur="0.5s" repeatCount="indefinite" />
      </rect>
    </g>
  </svg>
)

export default ForgeLogo
