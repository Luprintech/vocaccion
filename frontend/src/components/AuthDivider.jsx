import React from 'react';

const AuthDivider = ({ text = 'o continúa con' }) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white text-gray-500 font-medium">
          {text}
        </span>
      </div>
    </div>
  );
};

export default AuthDivider;