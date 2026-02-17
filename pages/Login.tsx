
import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, Settings, Users, QrCode, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const { login } = useApp();

  const roles: { role: UserRole; label: string; desc: string; icon: any; color: string; gradient: string }[] = [
    { role: 'MANAGER', label: 'القيادة المدرسية', desc: 'إشراف عام وتقارير استراتيجية', icon: ShieldCheck, color: 'text-indigo-600', gradient: 'from-indigo-500 to-blue-600' },
    { role: 'CONTROL', label: 'إدارة الكنترول', desc: 'توزيع اللجان واستلام المظاريف', icon: Settings, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
    { role: 'COUNSELOR', label: 'التوجيه الطلابي', desc: 'رصد الغياب والتواصل مع الأولياء', icon: Users, color: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
    { role: 'TEACHER', label: 'المعلم المراقب', desc: 'رصد الحضور الذكي وتسليم اللجنة', icon: QrCode, color: 'text-rose-600', gradient: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-xl z-10 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex bg-white p-5 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 mb-4 animate-bounce">
            <ShieldCheck className="text-blue-600 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-[900] text-slate-900 tracking-tight">SEMS <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-bold text-lg">نظام إدارة الاختبارات الذكي - الجيل الرابع</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((item, idx) => (
            <button
              key={item.role}
              onClick={() => login(item.role)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-2xl transition-all duration-500 text-right overflow-hidden animate-fade-in"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="flex flex-col gap-4">
                <div className={`${item.color} bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                  <item.icon size={28} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{item.label}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                  دخول النظام <ArrowLeft size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-8 text-center">
            <p className="text-slate-400 text-sm font-bold flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                جميع الأنظمة تعمل بكفاءة عالية بالسحابة
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
