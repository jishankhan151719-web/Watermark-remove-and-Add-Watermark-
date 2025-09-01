
import React from 'react';

const BearIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 6c.83 0 1.5.67 1.5 1.5S10.33 11 9.5 11 8 10.33 8 9.5 8.67 8 9.5 8zm5 0c.83 0 1.5.67 1.5 1.5S15.33 11 14.5 11s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-2.5 9.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
  </svg>
);

export default BearIcon;
