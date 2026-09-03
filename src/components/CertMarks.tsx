interface CertMarksProps {
  caption?: string;
  className?: string;
}

export function CertMarks({ caption, className = '' }: CertMarksProps) {
  return (
    <div className={`product-cert ${className}`.trim()} aria-label="สินค้า OTOP มาตรฐานผลิตภัณฑ์ชุมชน">
      <span className="product-cert__seal" title="OTOP หนึ่งตำบล หนึ่งผลิตภัณฑ์">
        <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="31" fill="#5b2a12" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#e8c56a" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="22.5" fill="none" stroke="#fff8ef" strokeWidth="0.6" opacity="0.35" />
          <text
            x="32"
            y="37"
            textAnchor="middle"
            fill="#fff8ef"
            fontSize="13"
            fontWeight="800"
            fontFamily="Sarabun, Arial, sans-serif"
            letterSpacing="0.8"
          >
            OTOP
          </text>
        </svg>
      </span>
      <span className="product-cert__seal" title="มาตรฐานผลิตภัณฑ์ชุมชน มผช">
        <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="31" fill="#e4c56a" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#5b2a12" strokeWidth="2" />
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fill="#3a1f10"
            fontSize="15"
            fontWeight="800"
            fontFamily="Sarabun, Tahoma, sans-serif"
          >
            มผช
          </text>
        </svg>
      </span>
      {caption ? <span className="product-cert__caption">{caption}</span> : null}
    </div>
  );
}
