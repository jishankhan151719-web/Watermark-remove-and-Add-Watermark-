import React from 'react';

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
    aria-hidden="true"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default PlayIcon;
