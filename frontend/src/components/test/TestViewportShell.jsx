import React from 'react';

/**
 * TestViewportShell
 * Layout base reutilizable para TODAS las pantallas del test:
 * - mismo ancho máximo
 * - misma tarjeta principal
 * - estructura header / content / footer
 */
export default function TestViewportShell({
  header,
  children,
  footer,
  className = '',
  contentClassName = '',
  fillHeight = true,
  contentGrow = true,
  centered = false,
}) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full md:h-[calc(100vh-72px)] p-0 md:p-2 ${centered ? 'md:flex md:items-center md:justify-center' : ''} ${className}`}>
      <div className={`w-full max-w-[1200px] mx-auto ${fillHeight ? 'h-full' : ''}`}>
        <div className={`bg-white rounded-none md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col ${fillHeight ? 'h-full' : 'h-auto'}`}>
          {header && <div className="px-4 md:px-6 py-4 border-b border-gray-100">{header}</div>}

          <div className={`${contentGrow ? 'flex-1' : ''} px-4 md:px-6 py-4 ${contentClassName}`}>
            {children}
          </div>

          {footer && <div className="px-4 md:px-6 py-4 border-t border-gray-100">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
