import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, duration = 2000, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, duration, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
    >
      <div className="bg-on-surface text-surface px-6 py-3 rounded-full shadow-lg flex items-center gap-3 min-w-[200px] justify-center">
        <span className="text-sm font-bold tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default Toast;