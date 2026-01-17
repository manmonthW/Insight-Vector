
import React, { useState } from 'react';

interface Props {
  onSubmit: (input: string) => void;
}

const StageInput: React.FC<Props> = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
        维度罗盘 <span className="text-emerald-500">/ Insight Vector</span>
      </h1>
      <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl font-light">
        超越认知的迷雾。将复杂混乱的思绪，
        <span className="text-emerald-400 font-medium"> 压缩至第一性原理</span>。
      </p>

      <div className="w-full relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今天你对什么感到困惑？(例如：我担心AI会取代我的工作)"
          className="w-full h-32 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-2xl resize-none"
        />
        <div className="absolute inset-0 -z-10 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
      </div>

      <button
        onClick={() => input.trim() && onSubmit(input)}
        disabled={!input.trim()}
        className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center gap-2 group"
      >
        <span>开启解构 / Deconstruct</span>
        <svg 
          className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mono uppercase tracking-widest text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          向量化
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
          高维映射
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
          第一性原理
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
          降维隐喻
        </div>
      </div>
    </div>
  );
};

export default StageInput;
