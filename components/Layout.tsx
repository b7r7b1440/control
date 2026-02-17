
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, FileText, LogOut, School, 
  ClipboardList, HeartHandshake, QrCode, Wand2, Printer, User, Menu
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = currentUser?.role;

  const menuItems = [
    ...(userRole !== 'TEACHER' ? [{ id: '/', label: 'الرئيسية', icon: LayoutDashboard }] : []),
    ...(userRole === 'CONTROL' ? [
        { id: '/setup', label: 'الإعداد', icon: Wand2 },
        { id: '/control', label: 'اللجان', icon: ClipboardList },
        { id: '/scanner', label: 'المسح', icon: QrCode },
        { id: '/print', label: 'الطباعة', icon: Printer }
    ] : []),
    ...(userRole === 'MANAGER' || userRole === 'CONTROL' ? [{ id: '/reports', label: 'التقارير', icon: FileText }] : []),
    ...(userRole === 'COUNSELOR' || userRole === 'MANAGER' ? [{ id: '/attendance', label: 'الغياب', icon: HeartHandshake }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col lg:flex-row font-sans text-right" dir="rtl">
      
      {/* Desktop Sidebar - Side by side with content */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white sticky top-0 h-screen z-50 shadow-2xl shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <School className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">SEMS PRO</h1>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Smart Control</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold group ${
                  isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold">
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header (Fixed Top) */}
      <header className="lg:hidden bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <School className="text-white w-5 h-5" />
          </div>
          <h1 className="text-base font-black text-slate-900">SEMS PRO</h1>
        </div>
        <button onClick={logout} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full">
            <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area - Properly positioned next to sidebar */}
      <main className="flex-1 min-w-0 bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 xl:p-10 pb-32 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Elegant Glass Style */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl text-white py-3 z-[60] flex justify-around items-center shadow-2xl rounded-[2rem] border border-white/10">
        {menuItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-blue-400 scale-110' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className={`text-[8px] font-black ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
