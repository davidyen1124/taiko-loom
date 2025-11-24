type IconProps = {
  className?: string;
};

export const IconArrowLeft = ({ className }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
