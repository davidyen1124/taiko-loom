type IconProps = {
  className?: string;
};

export const IconPause = ({ className }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
  </svg>
);
