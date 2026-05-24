import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Award, TrendingUp, Download, Search, Filter, ChevronDown, BarChart3, Trash2, Eye, LogOut, Loader2, Lock, AlertCircle } from 'lucide-react';
import { getAllResults, getStatistics, deleteResult, exportToCSV } from '../lib/supabase';

const FONT_STYLE = { fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif' };

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_TEACHER_PASSWORD || 'teacher123';
    if (password === correctPassword) {
      setAuthenticated(true);
      sessionStorage.setItem('teacher_auth', 'true');
    } else {
      setAuthError('كلمة المرور غير صحيحة');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('teacher_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" style={FONT_STYLE}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">لوحة تحكم المعلم</h1>
            <p className="text-slate-600 text-sm">أدخل كلمة المرور للدخول</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
              className="w-full bg-stone-50 border border-stone-300 px-4 py-3 rounded-xl mb-3 text-center"
              placeholder="كلمة المرور"
              dir="ltr"
            />
            {authError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {authError}
              </div>
            )}
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold">
              دخول
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full mt-3 text-slate-500 hover:text-slate-700 text-sm py-2">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard navigate={navigate} onLogout={() => { sessionStorage.removeItem('teacher_auth'); setAuthenticated(false); }} />;
}

function Dashboard({ navigate, onLogout }) {
  const [activeExam, setActiveExam] = useState('qudurat');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeExam]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultsData, statsData] = await Promise.all([
        getAllResults(activeExam),
        getStatistics(activeExam),
      ]);
      setResults(resultsData || []);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه النتيجة؟')) return;
    try {
      await deleteResult(id);
      loadData();
    } catch (err) {
      alert('خطأ في الحذف: ' + err.message);
    }
  };

  const handleExport = () => {
    const filtered = filteredResults();
    if (filtered.length === 0) {
      alert('لا توجد نتائج للتصدير');
      return;
    }
    exportToCSV(filtered, activeExam);
  };

  const filteredResults = () => {
    let filtered = results;
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.student_id && r.student_id.includes(searchTerm))
      );
    }
    if (classFilter !== 'all') {
      filtered = filtered.filter(r => r.student_class === classFilter);
    }
    return filtered;
  };

  const uniqueClasses = [...new Set(results.map(r => r.student_class).filter(Boolean))];

  return (
    <div dir="rtl" className="min-h-screen bg-stone-100" style={FONT_STYLE}>
      {/* الترويسة */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">لوحة تحكم المعلم</h1>
              <p className="text-xs text-slate-400">منصة الاختبارات التشخيصية</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
              <Home className="w-4 h-4" /> <span className="hidden md:inline">الرئيسية</span>
            </button>
            <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
              <LogOut className="w-4 h-4" /> <span className="hidden md:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* اختيار نوع الاختبار */}
        <div className="bg-white rounded-2xl shadow-md p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveExam('qudurat')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${activeExam === 'qudurat' ? 'bg-amber-500 text-slate-900' : 'text-slate-600 hover:bg-stone-100'}`}
          >
            🔤 القدرات
          </button>
          <button
            onClick={() => setActiveExam('tahsili')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${activeExam === 'tahsili' ? 'text-white' : 'text-slate-600 hover:bg-stone-100'}`}
            style={{ backgroundColor: activeExam === 'tahsili' ? '#0E7490' : 'transparent' }}
          >
            🧪 التحصيلي
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 text-red-800 p-4 rounded-lg mb-4">
            <strong>خطأ:</strong> {error}
            <div className="text-xs mt-1">تأكد من إعداد متغيرات Supabase في ملف .env</div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            {/* الإحصائيات */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={Users} label="عدد الطلاب" value={stats.uniqueStudents} color="blue" />
                <StatCard icon={Award} label="عدد المحاولات" value={stats.totalAttempts} color="amber" />
                <StatCard icon={TrendingUp} label="متوسط الدرجة" value={stats.averageScore} color="green" />
                <StatCard icon={BarChart3} label="متوسط النسبة" value={`${stats.averagePercentage}%`} color="purple" />
              </div>
            )}

            {/* أدوات البحث والتصفية */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-4 flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم الطالب أو رقم الجلوس..."
                  className="w-full bg-stone-50 border border-stone-300 pr-10 pl-4 py-2.5 rounded-xl"
                />
              </div>
              {uniqueClasses.length > 0 && (
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-300 px-4 py-2.5 rounded-xl"
                >
                  <option value="all">جميع الشعب</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> تصدير Excel
              </button>
            </div>

            {/* جدول النتائج */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">النتائج ({filteredResults().length})</h3>
              </div>
              {filteredResults().length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  {results.length === 0 ? 'لا توجد نتائج بعد. شارك رابط الاختبار مع الطلاب.' : 'لا توجد نتائج تطابق البحث.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">الطالب</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 hidden md:table-cell">الشعبة</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 hidden md:table-cell">التاريخ</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">الدرجة</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">النسبة</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredResults().map((r) => {
                        const pct = parseFloat(r.percentage);
                        return (
                          <tr key={r.id} className="hover:bg-stone-50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{r.student_name}</div>
                              {r.student_id && <div className="text-xs text-slate-500">{r.student_id}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{r.student_class || '-'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                              {new Date(r.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">{r.total_score}/{r.total_questions}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg" style={{ color: pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>
                                  {pct}%
                                </span>
                                <div className="w-12 h-2 bg-stone-200 rounded-full overflow-hidden hidden md:block">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => setSelectedResult(r)} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* نافذة تفاصيل النتيجة */}
      {selectedResult && <ResultDetails result={selectedResult} examType={activeExam} onClose={() => setSelectedResult(null)} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${c.icon}`} />
        <span className={`text-xs font-semibold ${c.text}`}>{label}</span>
      </div>
      <div className={`text-3xl font-black ${c.text}`}>{value}</div>
    </div>
  );
}

function ResultDetails({ result, examType, onClose }) {
  const stats = result.subject_stats;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{result.student_name}</h3>
            <p className="text-sm text-slate-500">{result.student_class || 'بدون شعبة'} • {new Date(result.created_at).toLocaleString('ar-SA')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl">×</button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-black mb-2" style={{ color: parseFloat(result.percentage) >= 70 ? '#16a34a' : parseFloat(result.percentage) >= 50 ? '#d97706' : '#dc2626' }}>
              {result.percentage}%
            </div>
            <div className="text-lg font-bold text-slate-700">{result.total_score} من {result.total_questions}</div>
            <div className="text-sm text-slate-500 mt-1">الوقت المستغرق: {Math.floor(result.time_spent / 60)} دقيقة</div>
          </div>

          <div className="space-y-3">
            {examType === 'qudurat' ? (
              <>
                {stats.lafzy && (
                  <SubjectRow name="القسم اللفظي" correct={stats.lafzy.correct} total={stats.lafzy.total} color="#d97706" />
                )}
                {stats.kammi && (
                  <SubjectRow name="القسم الكمي" correct={stats.kammi.correct} total={stats.kammi.total} color="#2563eb" />
                )}
                {stats.subsections && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-bold text-slate-700 mb-3">التفصيل بالمحاور:</div>
                    {Object.entries(stats.subsections).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-1.5 text-sm">
                        <span className="text-slate-600">{key}</span>
                        <span className="font-bold">{val.correct}/{val.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <SubjectRow name="الفيزياء" correct={stats.physics?.correct || 0} total={15} color="#0E7490" />
                <SubjectRow name="الكيمياء" correct={stats.chemistry?.correct || 0} total={15} color="#15803D" />
                <SubjectRow name="الأحياء" correct={stats.biology?.correct || 0} total={15} color="#B8860B" />
                <SubjectRow name="الرياضيات" correct={stats.math?.correct || 0} total={15} color="#B91C1C" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectRow({ name, correct, total, color }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <div className="bg-stone-50 rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-slate-900">{name}</span>
        <span className="font-bold" style={{ color }}>{correct}/{total} ({pct}%)</span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
