type IconProps = {
  className?: string;
};

export const IconPlay = ({ className }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M7 5v14l11-7-11-7z" fill="currentColor" />
  </svg>
);
