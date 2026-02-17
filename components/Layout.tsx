
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, FileText, LogOut, School, 
  ClipboardList, HeartHandshake, QrCode, Wand2, Printer, User
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
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col font-sans text-right" dir="rtl">
      
      {/* Mobile Top Header */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <School className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">SEMS PRO</h1>
            <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Mobile Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="bg-slate-100 p-2 rounded-full text-slate-500">
              <User size={18} />
           </div>
           <button onClick={logout} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-32 pt-4 px-4 md:px-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-2 py-3 pb-8 z-50 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-blue-600 scale-110' : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar - Desktop Only (Optional backup) */}
      <aside className="hidden xl:flex flex-col w-72 bg-slate-900 text-white fixed right-0 top-0 bottom-0 z-50 shadow-2xl">
        {/* ... Sidebar content (remains for desktop users) ... */}
      </aside>
    </div>
  );
};

export default Layout;
