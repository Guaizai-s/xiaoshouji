import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Mic, 
  Database, 
  Palette, 
  Image as ImageIcon, 
  Smartphone,
  ChevronRight, 
  ChevronLeft,
  Battery,
  Wifi,
  Signal,
  MessageCircle,
  Music,
  BookOpen,
  Gamepad2,
  Camera,
  CloudSun,
  Settings,
  Phone,
  Compass,
  MessageSquare
} from 'lucide-react';

// 列表项组件
const SettingItem = ({ icon: Icon, label, color, onClick, value = "", isLast = false }) => (
  <div 
    className={`flex items-center justify-between pl-4 py-2.5 bg-white active:bg-gray-200 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-100' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center space-x-3">
      {Icon && (
        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${color}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      )}
      <span className="text-[17px] text-black tracking-wide">{label}</span>
    </div>
    <div className="flex items-center text-gray-400 space-x-1 pr-4">
      {value && <span className="text-[16px] text-gray-500">{value}</span>}
      <ChevronRight size={20} className="text-gray-300" />
    </div>
  </div>
);

// 带文件上传的列表项组件
const UploadItem = ({ icon: Icon, label, color, isLast = false }) => (
  <label className={`flex items-center justify-between pl-4 py-2.5 bg-white active:bg-gray-200 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <div className="flex items-center space-x-3">
      {Icon && (
        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${color}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      )}
      <span className="text-[17px] text-black tracking-wide">{label}</span>
    </div>
    <div className="flex items-center pr-4">
      <span className="text-[16px] text-blue-500 mr-1">选择图片</span>
      <ChevronRight size={20} className="text-gray-300" />
      <input type="file" className="hidden" accept="image/*" />
    </div>
  </label>
);

const allApps = [
  { id: 'wechat', name: '微信', icon: MessageCircle, color: 'bg-green-500' },
  { id: 'ledger', name: '账本', icon: BookOpen, color: 'bg-orange-500' },
  { id: 'games', name: '游戏', icon: Gamepad2, color: 'bg-purple-500' },
  { id: 'photos', name: '相册', icon: ImageIcon, color: 'bg-blue-400' },
  { id: 'camera', name: '相机', icon: Camera, color: 'bg-gray-500' },
  { id: 'weather', name: '天气', icon: CloudSun, color: 'bg-blue-500' },
  { id: 'settings', name: '设置', icon: Settings, color: 'bg-gray-600' },
  { id: 'phone', name: '电话', icon: Phone, color: 'bg-green-500' },
  { id: 'safari', name: '浏览器', icon: Compass, color: 'bg-blue-500' },
  { id: 'messages', name: '信息', icon: MessageSquare, color: 'bg-green-400' },
  { id: 'music', name: '音乐', icon: Music, color: 'bg-red-500' },
];

export default function App() {
  const [time, setTime] = useState(new Date());
  const [activePage, setActivePage] = useState('main'); // 'main' 或 'appearance'

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      {/* 手机外框 */}
      <div className="relative w-[360px] h-[780px] bg-black rounded-[3.5rem] shadow-2xl border-[12px] border-gray-900 overflow-hidden shrink-0 flex flex-col">
        
        {/* 全局状态栏 */}
        <div className="absolute top-0 w-full h-[44px] flex items-center justify-between px-6 z-50 text-black font-semibold text-[15px]">
          <div className="flex-1 flex justify-start pl-1">{formatTime(time)}</div>
          
          {/* 模拟刘海/灵动岛 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 w-[120px] h-[30px] bg-black rounded-full"></div>
          
          <div className="flex-1 flex justify-end items-center space-x-1.5 pr-1">
            <Signal size={16} strokeWidth={2.5} />
            <Wifi size={16} strokeWidth={2.5} />
            <Battery size={20} strokeWidth={2} />
          </div>
        </div>

        {/* 屏幕内容区 */}
        <div className="relative flex-1 bg-[#F2F2F7] overflow-hidden rounded-[2.5rem]">
          
          {/* 页面滑动长容器 (宽度为 200%，容纳两个页面) */}
          <div 
            className="absolute top-0 left-0 h-full flex transition-transform duration-300 ease-in-out will-change-transform"
            style={{ 
              width: '200%', 
              // 重点修复：向左偏移 50% 刚好是一个页面的宽度
              transform: activePage === 'main' ? 'translateX(0)' : 'translateX(-50%)' 
            }}
          >
            {/* 页面 1：主设置页 */}
            <div className="w-1/2 h-full flex flex-col pt-[44px] overflow-y-auto pb-8">
              <div className="px-5 pt-6 pb-2">
                <h1 className="text-[32px] font-bold text-black tracking-tight">设置</h1>
              </div>

              {/* API 分组 */}
              <div className="mt-2 mx-4 bg-white rounded-xl overflow-hidden shadow-sm">
                <SettingItem icon={Cpu} label="聊天 API" color="bg-blue-500" value="已配置" />
                <SettingItem icon={Mic} label="MiniMax 语音" color="bg-orange-500" value="未连接" isLast={true} />
              </div>

              {/* 数据管理分组 */}
              <div className="mt-8 mx-4 bg-white rounded-xl overflow-hidden shadow-sm">
                <SettingItem icon={Database} label="数据管理" color="bg-green-500" isLast={true} />
              </div>

              {/* 外观分组 */}
              <div className="mt-8 mx-4 bg-white rounded-xl overflow-hidden shadow-sm">
                <SettingItem 
                  icon={Palette} 
                  label="外观设置" 
                  color="bg-indigo-500" 
                  onClick={() => setActivePage('appearance')}
                  isLast={true} 
                />
              </div>

              <div className="mt-12 text-center text-[13px] text-gray-400">
                Vinci OS 1.0.2
              </div>
            </div>
            
            {/* 页面 2：外观设置子页 */}
            <div className="w-1/2 h-full flex flex-col pt-[44px] bg-[#F2F2F7]">
              {/* 子页面导航栏 */}
              <div className="h-[44px] flex items-center justify-between px-2 bg-[#F2F2F7] border-b border-gray-200/50 shrink-0 relative">
                <button 
                  onClick={() => setActivePage('main')}
                  className="flex items-center text-blue-500 active:opacity-50 px-2 z-10"
                >
                  <ChevronLeft size={28} className="-ml-2" />
                  <span className="text-[17px] -ml-1">设置</span>
                </button>
                <span className="text-[17px] font-semibold text-black absolute left-0 right-0 text-center pointer-events-none">
                  外观设置
                </span>
                <div className="w-16"></div> {/* 占位配重，保证标题居中 */}
              </div>

              {/* 子页内容区 */}
              <div className="flex-1 overflow-y-auto pt-8 pb-8">
                {/* 壁纸设置区 */}
                <div className="mx-4 bg-white rounded-xl overflow-hidden shadow-sm">
                  <UploadItem icon={ImageIcon} label="桌面壁纸" color="bg-cyan-500" isLast={true} />
                </div>
                <div className="px-8 mt-2 text-[13px] text-gray-500 leading-relaxed">
                  您可以上传自定义图片来替换系统默认的桌面壁纸。
                </div>

                {/* APP 图标列表区 */}
                <div className="px-8 mt-6 mb-2 text-[13px] text-gray-500 uppercase tracking-wider">
                  自定义 APP 图标
                </div>
                <div className="mx-4 bg-white rounded-xl overflow-hidden shadow-sm">
                  {allApps.map((app, index) => (
                    <UploadItem 
                      key={app.id} 
                      icon={app.icon} 
                      label={app.name} 
                      color={app.color} 
                      isLast={index === allApps.length - 1} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* 底部 Home 提示条 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black rounded-full z-50"></div>
      </div>
    </div>
  );
}