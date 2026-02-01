import React from 'react';
import { Token } from '../types';
import { KeyIcon, MoreVertIcon, ForumIcon, CodeIcon, CloudQueueIcon } from './Icons';

interface TokenCardProps {
  token: Token;
  onCopy: (code: string) => void;
  onMoreClick: (token: Token) => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, onCopy, onMoreClick }) => {
  // Format code with space: "123456" -> "123 456"
  const formattedCode = token.code.match(/.{1,3}/g)?.join(' ') || token.code;
  
  // Calculate stroke dasharray for SVG circle
  // Circumference of radius 15.9155 is approx 100
  const radius = 15.9155;
  const circumference = 100;
  const dashOffset = circumference - (token.remaining / token.period) * circumference;

  const renderIcon = (iconName?: string) => {
    const className = "text-primary w-7 h-7";
    switch (iconName) {
        case 'forum': return <ForumIcon className={className} />;
        case 'code': return <CodeIcon className={className} />;
        case 'cloud_queue': return <CloudQueueIcon className={className} />;
        default: return <KeyIcon className={className} />;
    }
  };

  return (
    <div 
      onClick={() => onCopy(token.code)}
      className="group relative flex flex-col justify-between rounded-3xl bg-surface-container p-6 shadow-sm border border-transparent hover:shadow-md hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
    >
      <div className="flex items-start justify-between w-full mb-4">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 p-2 overflow-hidden ${!token.icon?.startsWith('http') ? 'bg-primary/10' : 'bg-white p-1'}`}>
            {token.icon?.startsWith('http') ? (
               <img 
                 src={token.icon} 
                 alt={token.issuer} 
                 className="w-full h-full object-contain rounded-lg"
                 loading="lazy"
               />
            ) : (
                renderIcon(token.icon)
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-on-surface text-lg font-bold leading-snug">{token.issuer}</p>
            <p className="text-on-surface-variant text-sm font-medium leading-none truncate max-w-[160px]">{token.account}</p>
          </div>
        </div>
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onMoreClick(token);
            }}
            className="text-on-surface-variant hover:text-on-surface rounded-full p-2 hover:bg-on-surface/10 transition-colors"
        >
            <MoreVertIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 pl-1">
        <p className="text-primary text-[32px] font-bold tracking-[0.15em] tabular-nums leading-none font-display">
          {formattedCode}
        </p>
        
        {/* Animated Timer Circle */}
        <div className="relative flex items-center justify-center size-10">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background Circle */}
            <path 
              className="text-surface-variant" 
              d={`M18 2.0845 a ${radius} ${radius} 0 0 1 0 31.831 a ${radius} ${radius} 0 0 1 0 -31.831`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
            />
            {/* Progress Circle */}
            <path 
              className={`${token.remaining < 5 ? 'text-red-500' : 'text-primary'} transition-colors duration-500`} 
              d={`M18 2.0845 a ${radius} ${radius} 0 0 1 0 31.831 a ${radius} ${radius} 0 0 1 0 -31.831`} 
              fill="none" 
              stroke="currentColor" 
              strokeDasharray={`${circumference - dashOffset}, 100`} 
              strokeLinecap="round" 
              strokeWidth="3" 
            />
          </svg>
          <div className={`absolute text-xs font-bold ${token.remaining < 5 ? 'text-red-500' : 'text-on-surface-variant'} transition-colors`}>
            {token.remaining}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;