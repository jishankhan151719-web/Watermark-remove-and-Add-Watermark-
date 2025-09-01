import React from 'react';
import BearIcon from './icons/BearIcon';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center text-center">
      <BearIcon className="h-12 w-12 text-orange-500" />
      <div className="ml-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Watermark Bear
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          A friendly concept for adding & removing video watermarks
        </p>
      </div>
    </header>
  );
};

export default Header;
