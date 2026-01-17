
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, InsightResult, Vector, ThoughtStep } from './types';
import { getInsight } from './services/geminiService';
import StageInput from './components/StageInput';
import Visualizer from './components/Visualizer';

type TabType = 'map' | 'data' | 'principle' | 'metaphor';

const MAX_DEPTH = 3;

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.INPUT);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [loadingText, setLoadingText] = useState('正在初始化认知矩阵...');
  const [showTabs, setShowTabs] = useState(false);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);

  // History tracks the path of exploration
  const [path, setPath] = useState<string[]>([]);
  // Cache stores the results for every explored keyword to allow "free expansion"
  const [insightCache, setInsightCache] = useState<Record<string, InsightResult>>({});

  const currentKeyword = path[path.length - 1];
  const result = insightCache[currentKeyword];
  const depth = path.length;

  const cleanAIString = (str: string, prefix: string) => {
    if (!str) return '';
    // Strip prefixes and suffix logic often added by AI models
    let cleaned = str.replace(new RegExp(`^${prefix}`, 'i'), '');
    cleaned = cleaned.replace(/^[:：\s]+/, '');
    cleaned = cleaned.replace(/一样思考[。！]?$/, '');
    cleaned = cleaned.replace(/一样思考$/, '');
    return cleaned.trim();
  };

  const processProblem = async (input: string, isDrillDown = false) => {
    if (insightCache[input]) {
      setPath(prev => isDrillDown ? [...prev, input] : [input]);
      setStage(Stage.METAPHOR);
      setShowTabs(true);
      setActiveTab('map');
      return;
    }

    setStage(Stage.VECTORIZING);
    setSelectedVectorId(null);
    
    setTimeout(() => setLoadingText(isDrillDown ? `深入钻取：${input}...` : '解构语义维度空间...'), 800);
    
    const context = isDrillDown ? currentKeyword : undefined;
    try {
      const data = await getInsight(input, context);
      
      setInsightCache(prev => ({ ...prev, [input]: data }));
      setPath(prev => isDrillDown ? [...prev, input] : [input]);
      
      setTimeout(() => {
        if (isDrillDown) {
          setStage(Stage.METAPHOR);
          setShowTabs(true);
          setActiveTab('map');
        } else {
          setStage(Stage.MAPPING);
        }
      }, 1500);
    } catch (e) {
      setStage(Stage.INPUT);
    }
  };

  const handleDrillDown = (vectorId: string) => {
    if (depth >= MAX_DEPTH) return;
    const vector = result?.vectors.find(v => v.id === vectorId);
    if (vector) {
      processProblem(vector.keyword, true);
    }
  };

  const jumpToLevel = (idx: number) => {
    const newPath = path.slice(0, idx + 1);
    setPath(newPath);
    setStage(Stage.METAPHOR);
    setActiveTab('map');
  };

  useEffect(() => {
    if (stage === Stage.MAPPING && path.length === 1) {
      const timer = setTimeout(() => {
        setStage(Stage.COMPRESSING);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage, path.length]);

  const handleCompressed = useCallback(() => {
    setStage(Stage.PRINCIPLE);
    setTimeout(() => {
      setStage(Stage.METAPHOR);
      setShowTabs(true);
      setActiveTab('metaphor');
    }, 2500);
  }, []);

  const selectedVector = result?.vectors.find(v => v.id === selectedVectorId);

  const forestData = useMemo(() => {
    return {
      path,
      insightCache
    };
  }, [path, insightCache]);

  const renderTabContent = () => {
    if (!result) return null;

    switch (activeTab) {
      case 'map':
        return (
          <div className="relative w-full h-[65vh] rounded-3xl overflow-hidden border border-emerald-500/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Visualizer 
              vectors={result.vectors} 
              centerLabel={currentKeyword}
              isCompressing={stage === Stage.COMPRESSING}
              onCompressed={handleCompressed}
              onNodeClick={handleDrillDown}
              canDrillDown={depth < MAX_DEPTH}
              forest={forestData}
            />
            <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2 max-w-[80%]">
               {path.map((keyword, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                    <button 
                      onClick={() => jumpToLevel(idx)}
                      className={`px-3 py-1 rounded-md text-[10px] mono border transition-all hover:scale-105 active:scale-95 ${idx === path.length - 1 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 bg-slate-900/50'}`}
                    >
                      L{idx + 1}: {keyword.length > 12 ? keyword.substring(0, 10) + '..' : keyword}
                    </button>
                    {idx < path.length - 1 && <span className="text-slate-700 font-mono">/</span>}
                 </div>
               ))}
            </div>
            <div className="absolute bottom-6 right-6 pointer-events-none">
               <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 backdrop-blur-md">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">多维空间探索</p>
                 <p className="text-[9px] text-slate-500 leading-tight">
                   点击左上角标签快速回溯级别<br/>
                   点击图谱节点进入下一维度 ({depth}/{MAX_DEPTH})
                 </p>
               </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="glass-card p-8 rounded-3xl border-emerald-500/10 flex flex-col h-[60vh] overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs text-emerald-500 font-bold tracking-widest uppercase">L{depth} 特征向量集</h3>
                  <span className="text-[10px] text-slate-500 font-mono">点击查看深意并解锁钻取</span>
               </div>
               <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                 {result.vectors.map((v, i) => (
                   <div 
                    key={v.id} 
                    className={`group cursor-pointer p-3 rounded-xl border transition-all ${selectedVectorId === v.id ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                    onClick={() => setSelectedVectorId(v.id)}
                   >
                      <div className="flex justify-between text-xs mb-2">
                        <span className={`font-medium transition-colors ${selectedVectorId === v.id ? 'text-emerald-400' : 'text-slate-300 group-hover:text-emerald-300'}`}>{v.keyword}</span>
                        <div className="flex items-center gap-2">
                          <span className="mono text-emerald-500 font-bold">{(v.weight * 100).toFixed(1)}%</span>
                          {insightCache[v.keyword] && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">已解构</span>}
                        </div>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/40" style={{ width: `${v.weight * 100}%`, transitionDelay: `${i * 50}ms` }}></div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
            
            <div className="flex flex-col gap-6 h-[60vh]">
              <div className="glass-card p-8 rounded-3xl border-emerald-500/10 flex-1 flex flex-col relative overflow-hidden">
                {selectedVector ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-bold mono uppercase tracking-wider">深度解析</div>
                      <h4 className="text-xl font-bold text-white tracking-tight">{selectedVector.keyword}</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                       <p className="text-lg text-slate-300 leading-relaxed font-light italic">
                         "{selectedVector.description}"
                       </p>
                    </div>
                    {depth < MAX_DEPTH && (
                      <button 
                        onClick={() => handleDrillDown(selectedVector.id)}
                        className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                      >
                        {insightCache[selectedVector.keyword] ? '查看已钻取的分析' : `针对此维度进行钻取分析 (L${depth+1})`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center opacity-40">
                     <p className="text-sm text-slate-400">选择左侧向量以探索认知深义</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'principle':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] absolute"></div>
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-xs text-emerald-500 uppercase tracking-[0.5em] mb-8 font-bold opacity-60">
                L{depth} 底层逻辑 / FIRST PRINCIPLE
              </h2>
              <div className="h-[1px] w-24 bg-emerald-500/50 mx-auto mb-12"></div>
              <p className="text-3xl md:text-5xl font-bold tracking-tight text-white glow-text leading-tight mb-8">
                {result.firstPrinciple}
              </p>
              <div className="flex justify-center gap-2">
                {[...Array(depth)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>)}
                {[...Array(MAX_DEPTH - depth)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-slate-800"></div>)}
              </div>
            </div>
          </div>
        );
      case 'metaphor':
        return (
          <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
            <div className="glass-card p-8 md:p-14 rounded-[3rem] relative overflow-hidden border-emerald-500/20 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 -translate-y-1/2 translate-x-1/2 rounded-full blur-[100px]"></div>
              
              <div className="space-y-12">
                <div className="flex items-start gap-8">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 font-bold border border-red-500/20 shrink-0">
                    -
                  </div>
                  <div className="pt-2">
                    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-[0.2em] mb-4">停止固有思维模式 / OLD PATTERN (L{depth})</p>
                    <div className="text-2xl md:text-4xl text-slate-400 font-light leading-relaxed">
                      停止像 <span className="text-slate-200 font-medium italic underline decoration-red-500/20 underline-offset-[12px]">{cleanAIString(result.oldPattern, '停止像')}</span> 一样思考
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

                <div className="flex items-start gap-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 shrink-0 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    +
                  </div>
                  <div className="pt-2">
                    <p className="text-emerald-500 uppercase text-[10px] font-bold tracking-[0.2em] mb-4">开启降维隐喻洞察 / NEW METAPHOR (L{depth})</p>
                    <div className="text-3xl md:text-6xl text-white font-bold leading-tight glow-text">
                      开始像 <span className="text-emerald-400">{cleanAIString(result.newMetaphor, '开始像')}</span> 一样思考
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {depth < MAX_DEPTH && (
              <div className="mt-8 text-center">
                <p className="text-xs text-emerald-500/60 uppercase tracking-widest animate-pulse">
                  切换至“星状图谱”探索更深层 (L{depth+1}) 的维度
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[100vw] h-[100vw] bg-emerald-600/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[80vw] h-[80vw] bg-cyan-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      </div>

      <header className="relative z-20 px-8 py-6 flex justify-between items-center border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div 
            className="text-xl font-bold tracking-tighter flex items-center gap-3 cursor-pointer group"
            onClick={() => { setStage(Stage.INPUT); setPath([]); setInsightCache({}); }}
          >
            <div className="w-5 h-5 bg-emerald-500 rounded-sm rotate-45 group-hover:rotate-180 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            <span className="tracking-widest flex items-baseline gap-2 text-white">
              维度罗盘 <span className="text-[10px] text-emerald-500 font-mono opacity-60">INSIGHT VECTOR</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="mono text-[10px] text-slate-500 uppercase tracking-widest hidden md:block">
            {stage === Stage.INPUT ? 'Waiting...' : `DEPTH L${depth} // ${stage}`}
          </div>
          {showTabs && (
            <button onClick={() => { setStage(Stage.INPUT); setPath([]); setInsightCache({}); }} className="text-[10px] px-4 py-1.5 border border-slate-700 rounded-full text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
              重置认知协议
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8 flex flex-col">
        {stage === Stage.INPUT && <StageInput onSubmit={processProblem} />}

        {stage === Stage.VECTORIZING && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="w-20 h-20 relative mb-8">
              <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-emerald-400 text-sm tracking-[0.2em] font-medium animate-pulse uppercase">{loadingText}</p>
          </div>
        )}

        {(stage === Stage.MAPPING || stage === Stage.COMPRESSING || stage === Stage.PRINCIPLE || stage === Stage.METAPHOR) && result && (
          <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
            {showTabs && (
              <div className="flex justify-center mb-10">
                <div className="inline-flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
                  {[
                    { id: 'map', label: '星状图谱', icon: '◈' },
                    { id: 'data', label: '特征向量', icon: '▤' },
                    { id: 'principle', label: '底层逻辑', icon: '◎' },
                    { id: 'metaphor', label: '认知重构', icon: '✦' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 tracking-widest uppercase ${
                        activeTab === tab.id 
                          ? 'bg-emerald-600 text-white shadow-lg' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              {showTabs ? renderTabContent() : (
                <div className="flex-1 flex flex-col items-center justify-center">
                   {(stage === Stage.MAPPING || stage === Stage.COMPRESSING) && (
                     <div className="w-full h-[70vh] rounded-3xl overflow-hidden border border-emerald-500/5">
                        <Visualizer 
                          vectors={result.vectors} 
                          centerLabel={currentKeyword}
                          isCompressing={stage === Stage.COMPRESSING}
                          onCompressed={handleCompressed}
                          forest={forestData}
                        />
                     </div>
                   )}
                   {stage === Stage.PRINCIPLE && (
                      <div className="animate-in fade-in zoom-in duration-1000 text-center">
                        <h2 className="text-xs text-emerald-500 uppercase tracking-[0.5em] mb-8 font-bold opacity-60">核心逻辑洞察 (L{depth})...</h2>
                        <p className="text-3xl md:text-5xl font-bold tracking-tight text-white glow-text leading-tight">{result.firstPrinciple}</p>
                      </div>
                   )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 p-6 border-t border-white/5 bg-slate-950/20 text-center">
        <div className="text-[9px] text-slate-700 uppercase tracking-[0.4em] mb-1">
          {path.join(' → ') || 'Root Context'}
        </div>
        <div className="text-slate-800 text-[8px] font-mono">
          INSIGHT VECTOR PROTOCOL // MULTI-LEVEL COGNITION ENABLED
        </div>
      </footer>
    </div>
  );
};

export default App;
