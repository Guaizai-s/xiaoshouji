import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Music, BookOpen, Gamepad2, 
  Image as ImageIcon, Camera, CloudSun, Settings, 
  Phone, Compass, MessageSquare, Battery, Wifi, 
  Signal, Calendar, Clock, BatteryMedium, Heart,
  Mail, Map, Calculator, Wallet, Activity, Minus
} from 'lucide-react';

// --- 自定义样式注入 (流光动画、毛玻璃与抖动特效) ---
const styles = `
  @keyframes shimmer {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }
  .animate-shimmer {
    animation: shimmer 3s infinite ease-in-out;
  }
  .glass-panel {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.1);
  }
  
  /* 隐藏滚动条 */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* iOS 抖动动画 - 精调优化版 */
  @keyframes jiggle {
    0% { transform: rotate(-1deg); }
    50% { transform: rotate(1.2deg); }
    100% { transform: rotate(-1deg); }
  }
  .is-jiggling {
    animation: jiggle 0.25s linear infinite;
  }
  /* 让不同图标抖动频率更随机错开，显得更真实 */
  .is-jiggling:nth-child(odd) { animation-duration: 0.27s; animation-direction: reverse; }
  .is-jiggling:nth-child(even) { animation-duration: 0.24s; }
`;

// --- 基础应用图标组件 ---
const AppIcon = ({ name, icon: Icon, color, hideName = false }) => (
  <div className="flex flex-col items-center justify-start w-full pointer-events-none">
    <div className={`w-[60px] h-[60px] rounded-[1.25rem] flex items-center justify-center text-white shadow-sm ${color}`}>
      <Icon size={32} strokeWidth={1.5} />
    </div>
    {!hideName && (
      <span className="text-white text-[11px] mt-1.5 font-medium drop-shadow-md tracking-wide">
        {name}
      </span>
    )}
  </div>
);

// --- 小组件集 ---
const TransparentClockWidget = ({ time }) => {
  // 如果没有传 time，提供一个保底时间以防报错
  const validTime = time || new Date(); 
  const hours = validTime.getHours().toString().padStart(2, '0');
  const minutes = validTime.getMinutes().toString().padStart(2, '0');
  const dateStr = validTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative pointer-events-none pt-2">
      <div className="text-white text-[76px] font-extralight tracking-tight leading-none drop-shadow-lg">
        {hours}:{minutes}
      </div>
      <div className="text-white/90 text-[16px] font-medium mt-1 drop-shadow-md tracking-wide">
        {dateStr}
      </div>
    </div>
  );
};

const BatteryWidget = () => (
  <div className="w-full h-full glass-panel rounded-[1.5rem] p-3 flex items-center justify-between relative overflow-hidden pointer-events-none">
    <div className="flex items-center space-x-3 z-10">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path className="text-white/20" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" strokeDasharray="80, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <BatteryMedium size={16} className="absolute text-green-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-white text-xs font-medium">云溪的 iPhone</span>
        <span className="text-green-400 text-sm font-bold">80%</span>
      </div>
    </div>
  </div>
);

const CountdownWidget = () => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-3 flex items-center justify-between relative overflow-hidden pointer-events-none shadow-lg shadow-purple-900/20">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    <div className="flex flex-col z-10">
      <span className="text-white/80 text-xs font-medium mb-0.5 flex items-center"><Calendar size={12} className="mr-1"/> 距离发薪日</span>
      <span className="text-white text-base font-bold">还有 <span className="text-2xl">12</span> 天</span>
    </div>
  </div>
);

const PhotoWidget = () => (
  <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative pointer-events-none shadow-md">
    <img 
      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" 
      alt="Album" 
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40"></div>
    <div className="absolute bottom-3 left-3 text-white">
      <p className="text-xs font-medium opacity-80">回忆</p>
      <p className="text-sm font-bold">加州海岸</p>
    </div>
  </div>
);


export default function App() {
  const [time, setTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const scrollRef = useRef(null);

  // 将初始布局数据提取到 State 中，支持增删改查
  const [pages, setPages] = useState([
    [
      { type: 'widget', id: 'w-clock', component: TransparentClockWidget, span: 'col-span-4 row-span-2' },
      { type: 'widget', id: 'w-battery', component: BatteryWidget, span: 'col-span-2 row-span-1' },
      { type: 'widget', id: 'w-countdown', component: CountdownWidget, span: 'col-span-2 row-span-1' },
      { type: 'app', id: 'wechat', name: '微信', icon: MessageCircle, color: 'bg-gradient-to-b from-green-400 to-green-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'ledger', name: '账本', icon: BookOpen, color: 'bg-gradient-to-b from-yellow-400 to-orange-400', span: 'col-span-1 row-span-1' },
      { type: 'widget', id: 'w-photo', component: PhotoWidget, span: 'col-span-2 row-span-2' },
      { type: 'app', id: 'games', name: '游戏', icon: Gamepad2, color: 'bg-gradient-to-b from-indigo-400 to-purple-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'camera', name: '相机', icon: Camera, color: 'bg-gradient-to-b from-gray-200 to-gray-400 text-gray-800', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'weather', name: '天气', icon: CloudSun, color: 'bg-gradient-to-b from-blue-400 to-blue-600', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'settings', name: '设置', icon: Settings, color: 'bg-gradient-to-b from-gray-500 to-gray-700', span: 'col-span-1 row-span-1' },
    ],
    [
      { type: 'app', id: 'mail', name: '邮件', icon: Mail, color: 'bg-gradient-to-b from-blue-300 to-blue-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'map', name: '地图', icon: Map, color: 'bg-gradient-to-b from-green-300 to-green-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'calc', name: '计算器', icon: Calculator, color: 'bg-gradient-to-b from-orange-400 to-orange-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'wallet', name: '钱包', icon: Wallet, color: 'bg-gradient-to-b from-gray-800 to-black', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'health', name: '健康', icon: Heart, color: 'bg-white text-red-500', span: 'col-span-1 row-span-1' },
      { type: 'app', id: 'fitness', name: '健身', icon: Activity, color: 'bg-gradient-to-b from-black to-gray-800 text-green-400', span: 'col-span-1 row-span-1' },
    ]
  ]);

  const dockApps = [
    { id: 'phone', name: '电话', icon: Phone, color: 'bg-gradient-to-b from-green-400 to-green-500' },
    { id: 'safari', name: '浏览器', icon: Compass, color: 'bg-gradient-to-b from-blue-400 to-blue-500' },
    { id: 'messages', name: '信息', icon: MessageSquare, color: 'bg-gradient-to-b from-green-400 to-green-500' },
    { id: 'music', name: '音乐', icon: Music, color: 'bg-gradient-to-b from-rose-400 to-red-500' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const page = Math.round(scrollLeft / width);
      if (page !== currentPage) setCurrentPage(page);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // === 拖拽与长按逻辑 ===
  const longPressTimer = useRef(null);

  const handlePointerDown = () => {
    if (!isEditMode) {
      longPressTimer.current = setTimeout(() => setIsEditMode(true), 600);
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDelete = (pageIdx, id) => {
    setPages(prev => {
      const newPages = [...prev];
      newPages[pageIdx] = newPages[pageIdx].filter(item => item.id !== id);
      return newPages;
    });
  };

  const handleDragStart = (e, id) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // 允许放置
  };

  const handleDrop = (e, pageIdx, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    setPages(prev => {
      const newPages = [...prev];
      const page = [...newPages[pageIdx]];
      const dragIdx = page.findIndex(i => i.id === draggedId);
      const dropIdx = page.findIndex(i => i.id === targetId);
      
      if (dragIdx !== -1 && dropIdx !== -1) {
        // 将拖拽的物体插入到目标物体之前
        const [draggedItem] = page.splice(dragIdx, 1);
        page.splice(dropIdx, 0, draggedItem);
      }
      newPages[pageIdx] = page;
      return newPages;
    });
  };

  // 单个渲染包裹器，处理动画和事件
  const DraggableItemWrapper = ({ item, pageIdx }) => {
    return (
      <div 
        className={`relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform ${item.span} ${isEditMode ? 'is-jiggling' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        draggable={isEditMode}
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, pageIdx, item.id)}
      >
        {isEditMode && (
          <div 
            className="absolute -top-2 -left-2 w-7 h-7 bg-gray-200/90 backdrop-blur-md text-gray-700 rounded-full flex items-center justify-center z-50 shadow-md border-[1.5px] border-white/50 active:bg-gray-400"
            onClick={(e) => { e.stopPropagation(); handleDelete(pageIdx, item.id); }}
          >
            <Minus size={16} strokeWidth={3} />
          </div>
        )}
        
        {/* 动态传入 time 参数给组件 */}
        {item.type === 'widget' && <item.component time={time} />}
        {item.type === 'app' && <AppIcon {...item} />}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-[#121212] flex items-center justify-center sm:p-4"
      onClick={() => isEditMode && setIsEditMode(false)} // 点击背景退出编辑
    >
      <style>{styles}</style>
      
      {/* 移除厚重边框，只保留屏幕容器 */}
      <div className="relative w-full h-full sm:w-[390px] sm:h-[844px] sm:rounded-[2.5rem] overflow-hidden shrink-0 flex flex-col shadow-2xl ring-1 ring-white/10">
        
        {/* 高级流光壁纸 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-indigo-600 to-blue-400 opacity-90 transition-transform duration-1000 scale-105"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 backdrop-blur-[60px] bg-black/10"></div>
        
        {/* 全局状态栏 (移除了刘海/灵动岛) */}
        <div className="absolute top-0 w-full h-[44px] flex items-center justify-between px-6 z-50 text-white font-semibold text-[15px] drop-shadow-md pointer-events-none">
          <div className="flex-1 flex justify-start pl-1 tracking-wider">{formatTime(time)}</div>
          <div className="flex-1 flex justify-end items-center space-x-1.5 pr-1">
            <Signal size={16} strokeWidth={2.5} />
            <Wifi size={16} strokeWidth={2.5} />
            <Battery size={20} strokeWidth={2} />
          </div>
        </div>

        {/* 顶部编辑完成按钮 (编辑模式时显示) */}
        {isEditMode && (
          <div className="absolute top-[44px] right-4 z-50">
            <button 
              className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm border border-white/20 active:opacity-50"
              onClick={(e) => { e.stopPropagation(); setIsEditMode(false); }}
            >
              完成
            </button>
          </div>
        )}

        {/* 桌面横向滑动容器 */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar flex relative z-10 pt-16 pb-[120px]"
        >
          {pages.map((pageItems, pageIdx) => (
            <div 
              key={pageIdx} 
              className="w-full h-full shrink-0 snap-center px-5 grid grid-cols-4 gap-x-4 gap-y-5 place-content-start grid-flow-row-dense"
            >
              {pageItems.map((item) => (
                <DraggableItemWrapper key={item.id} item={item} pageIdx={pageIdx} />
              ))}
            </div>
          ))}
        </div>

        {/* 翻页指示器 (小圆点) */}
        <div className="absolute bottom-[115px] w-full flex justify-center space-x-2 z-20 pointer-events-none">
          {pages.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPage === idx ? 'bg-white' : 'bg-white/40'}`}></div>
          ))}
        </div>

        {/* 底部固定 Dock 栏 */}
        <div className="absolute bottom-6 left-4 right-4 h-[88px] rounded-[2rem] glass-panel flex items-center justify-around px-2 z-20">
          {dockApps.map((app) => (
            <div key={app.id} className={isEditMode ? 'is-jiggling' : ''}>
              <AppIcon 
                {...app}
                hideName={true} 
              />
            </div>
          ))}
        </div>

        {/* Home 指示条 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white rounded-full z-50 opacity-80 pointer-events-none"></div>
      </div>
    </div>
  );
}