import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, RotateCcw, ChevronRight, ChevronLeft, BarChart3, X, Check, AlertCircle, Trophy, Target, BookOpen, Calculator, Award, TrendingUp, Home, Loader2 } from 'lucide-react';
import { VERBAL_QUESTIONS, QUANT_QUESTIONS, QUDURAT_QUESTIONS, SUBSECTION_NAMES } from '../lib/quduratQuestions';
import { saveExamResult } from '../lib/supabase';

const FONT_STYLE = { fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif' };

export default function QuduratExam() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('welcome');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (screen !== 'exam') return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, timeLeft]);

  const startExam = () => {
    if (!studentName.trim()) return;
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(120 * 60);
    setStartTime(Date.now());
    setScreen('exam');
  };

  const selectAnswer = (qid, optIdx) => {
    setAnswers({ ...answers, [qid]: optIdx });
  };

  const handleFinish = async () => {
    let correctCount = 0;
    const subsectionStats = {};
    const subjectStats = { lafzy: { correct: 0, total: 40 }, kammi: { correct: 0, total: 40 } };

    QUDURAT_QUESTIONS.forEach(q => {
      if (!subsectionStats[q.subsection]) subsectionStats[q.subsection] = { correct: 0, total: 0 };
      subsectionStats[q.subsection].total++;
      if (answers[q.id] === q.correct) {
        correctCount++;
        subsectionStats[q.subsection].correct++;
        subjectStats[q.section].correct++;
      }
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const resultData = {
      studentName,
      studentId,
      studentClass,
      examType: 'qudurat',
      score: correctCount,
      totalQuestions: 80,
      subjectStats: { ...subjectStats, subsections: subsectionStats },
      answers,
      timeSpent: elapsed,
    };

    setResult(resultData);
    setScreen('result');

    // حفظ في Supabase
    setSaving(true);
    try {
      await saveExamResult(resultData);
      setSaving(false);
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  if (screen === 'welcome') return <WelcomeScreen {...{ studentName, setStudentName, studentId, setStudentId, studentClass, setStudentClass, onStart: startExam, navigate }} />;
  if (screen === 'exam') return <ExamScreen {...{ currentQ, setCurrentQ, answers, selectAnswer, timeLeft, onFinish: handleFinish, studentName }} />;
  if (screen === 'result') return <ResultScreen {...{ result, saving, saveError, navigate, onRestart: () => { setStudentName(''); setStudentId(''); setStudentClass(''); setAnswers({}); setCurrentQ(0); setScreen('welcome'); } }} />;
  return null;
}

// ============== شاشة الترحيب ==============
function WelcomeScreen({ studentName, setStudentName, studentId, setStudentId, studentClass, setStudentClass, onStart, navigate }) {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" style={FONT_STYLE}>
      <div className="max-w-2xl w-full">
        <button onClick={() => navigate('/')} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm">
          <Home className="w-4 h-4" /> العودة للرئيسية
        </button>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/30 px-8 py-4 flex items-center justify-between">
            <div className="bg-amber-500/20 border border-amber-500 text-amber-400 px-4 py-1.5 rounded-lg text-sm font-bold tracking-widest">
              QIYAS-STYLE
            </div>
            <div className="text-slate-400 text-sm">1447 هـ / 2026 م</div>
          </div>

          <div className="px-8 py-10 text-center">
            <div className="text-amber-400 text-base font-semibold tracking-[0.5em] mb-3">اختبار تشخيصي شامل</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">اختبار القدرات العامة</h1>
            <div className="text-slate-300 text-lg mb-2">القسم اللفظي • القسم الكمي</div>
            <div className="text-amber-400/80 text-sm italic mb-8">على نمط اختبار هيئة تقويم التعليم</div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/50 border border-amber-500/30 rounded-2xl p-4">
                <BookOpen className="w-7 h-7 text-amber-400 mx-auto mb-2" />
                <div className="text-white font-bold text-lg">القسم اللفظي</div>
                <div className="text-slate-400 text-xs mt-1">40 سؤالاً • 5 محاور</div>
              </div>
              <div className="bg-slate-800/50 border border-blue-400/30 rounded-2xl p-4">
                <Calculator className="w-7 h-7 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-bold text-lg">القسم الكمي</div>
                <div className="text-slate-400 text-xs mt-1">40 سؤالاً • 4 محاور</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-800/30 border border-slate-700 rounded-2xl p-4">
              <div>
                <div className="text-3xl font-black text-amber-400">80</div>
                <div className="text-xs text-slate-400 mt-1">سؤال</div>
              </div>
              <div className="border-x border-slate-700">
                <div className="text-3xl font-black text-amber-400">120</div>
                <div className="text-xs text-slate-400 mt-1">دقيقة</div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-400">80</div>
                <div className="text-xs text-slate-400 mt-1">درجة</div>
              </div>
            </div>

            <div className="space-y-3 text-right mb-6">
              <div>
                <label className="block text-white font-semibold mb-1 text-sm">اسم الطالب *</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl text-base"
                  placeholder="أدخل اسمك الكامل..."
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-semibold mb-1 text-sm">رقم الجلوس</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl text-base"
                    placeholder="اختياري"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1 text-sm">الصف/الشعبة</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl text-base"
                    placeholder="مثال: 3 ثانوي/أ"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onStart}
              disabled={!studentName.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5" />
              ابدأ الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== شاشة الاختبار ==============
function ExamScreen({ currentQ, setCurrentQ, answers, selectAnswer, timeLeft, onFinish, studentName }) {
  const question = QUDURAT_QUESTIONS[currentQ];
  const totalAnswered = Object.keys(answers).length;
  const progress = ((currentQ + 1) / QUDURAT_QUESTIONS.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeRunningOut = timeLeft < 300;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex flex-col" style={FONT_STYLE}>
      <div className="bg-slate-900 text-white px-4 py-3 shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNavigator(true)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </button>
            <div className="text-xs md:text-sm">
              <div className="text-slate-400">الطالب</div>
              <div className="font-semibold">{studentName}</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${isTimeRunningOut ? 'bg-red-500 animate-pulse' : 'bg-amber-500 text-slate-900'}`}>
            <Clock className="w-5 h-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>السؤال {currentQ + 1} من {QUDURAT_QUESTIONS.length}</span>
            <span>تمت إجابة {totalAnswered}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className={`px-3 py-1.5 rounded-lg font-semibold ${question.section === 'lafzy' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
              {question.section === 'lafzy' ? '🔤 لفظي' : '🔢 كمي'} • {SUBSECTION_NAMES[question.subsection]}
            </div>
            <div className="text-slate-500 text-xs">سؤال #{question.id}</div>
          </div>

          {question.passage && (
            <div className="bg-amber-50 border-r-4 border-amber-400 rounded-xl p-4 mb-4 text-slate-700 leading-relaxed text-sm md:text-base">
              {question.passage}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-5 md:p-7 mb-5">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">{question.q}</h2>
          </div>

          <div className="space-y-3 mb-6">
            {question.options.map((opt, idx) => {
              const isSelected = answers[question.id] === idx;
              const letters = ['أ', 'ب', 'ج', 'د'];
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(question.id, idx)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-lg' : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isSelected ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                    {letters[idx]}
                  </div>
                  <div className="flex-1 text-base">{opt}</div>
                  {isSelected && <Check className="w-5 h-5 text-slate-900" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 mb-6">
            <button onClick={() => currentQ > 0 && setCurrentQ(currentQ - 1)} disabled={currentQ === 0} className="flex-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <ChevronRight className="w-5 h-5" /> السابق
            </button>
            {currentQ < QUDURAT_QUESTIONS.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                التالي <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> إنهاء الاختبار
              </button>
            )}
          </div>

          <button onClick={() => setShowConfirm(true)} className="w-full text-slate-500 hover:text-red-600 text-sm py-2">
            إنهاء الاختبار وعرض النتيجة
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-7 h-7 text-amber-500" />
              <h3 className="text-xl font-bold">تأكيد إنهاء الاختبار</h3>
            </div>
            <p className="text-slate-600 mb-2">أجبت عن <strong>{totalAnswered}</strong> من <strong>{QUDURAT_QUESTIONS.length}</strong>.</p>
            {totalAnswered < QUDURAT_QUESTIONS.length && (
              <div className="bg-amber-50 border-r-4 border-amber-400 p-3 rounded-lg mb-4 text-sm text-amber-800">
                ⚠️ لم تجب عن {QUDURAT_QUESTIONS.length - totalAnswered} سؤالاً.
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold">العودة</button>
              <button onClick={onFinish} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold">إنهاء</button>
            </div>
          </div>
        </div>
      )}

      {showNavigator && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold">خريطة الأسئلة</h3>
              <button onClick={() => setShowNavigator(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto p-4">
              <div className="mb-4">
                <div className="text-sm font-bold text-amber-700 mb-2">القسم اللفظي</div>
                <div className="grid grid-cols-10 gap-2">
                  {VERBAL_QUESTIONS.map((q, idx) => (
                    <button key={q.id} onClick={() => { setCurrentQ(idx); setShowNavigator(false); }} className={`aspect-square rounded-lg text-sm font-bold ${currentQ === idx ? 'bg-amber-500 text-white' : answers[q.id] !== undefined ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-blue-700 mb-2">القسم الكمي</div>
                <div className="grid grid-cols-10 gap-2">
                  {QUANT_QUESTIONS.map((q, idx) => {
                    const realIdx = idx + 40;
                    return (
                      <button key={q.id} onClick={() => { setCurrentQ(realIdx); setShowNavigator(false); }} className={`aspect-square rounded-lg text-sm font-bold ${currentQ === realIdx ? 'bg-blue-500 text-white' : answers[q.id] !== undefined ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {idx + 41}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== شاشة النتائج ==============
function ResultScreen({ result, saving, saveError, navigate, onRestart }) {
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const lafzyPct = Math.round((result.subjectStats.lafzy.correct / 40) * 100);
  const kammiPct = Math.round((result.subjectStats.kammi.correct / 40) * 100);
  const minutes = Math.floor(result.timeSpent / 60);
  const seconds = result.timeSpent % 60;

  const getGrade = (pct) => {
    if (pct >= 85) return { label: 'ممتاز', color: 'text-green-600', bg: 'bg-green-50', icon: Trophy };
    if (pct >= 70) return { label: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-50', icon: Award };
    if (pct >= 55) return { label: 'جيد', color: 'text-amber-600', bg: 'bg-amber-50', icon: Target };
    if (pct >= 40) return { label: 'متوسط', color: 'text-orange-600', bg: 'bg-orange-50', icon: TrendingUp };
    return { label: 'يحتاج علاجاً', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
  };
  const grade = getGrade(percentage);
  const GradeIcon = grade.icon;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-4 md:p-8" style={FONT_STYLE}>
      <div className="max-w-4xl mx-auto">
        {saving && (
          <div className="bg-blue-50 border-r-4 border-blue-500 text-blue-800 p-3 rounded-lg mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">جاري حفظ النتيجة...</span>
          </div>
        )}
        {!saving && !saveError && (
          <div className="bg-green-50 border-r-4 border-green-500 text-green-800 p-3 rounded-lg mb-4 flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="text-sm">تم حفظ نتيجتك بنجاح!</span>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border-r-4 border-red-500 text-red-800 p-3 rounded-lg mb-4">
            <span className="text-sm">⚠️ خطأ في الحفظ: {saveError}</span>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className="p-6 md:p-10 text-center text-white">
            <GradeIcon className={`w-16 h-16 mx-auto mb-4 ${grade.color}`} />
            <div className="text-amber-400 text-sm tracking-widest mb-2">نتيجة الاختبار</div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{result.studentName}</h1>
            <div className="text-slate-400 text-sm mb-6">{new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="bg-slate-800/50 rounded-3xl p-6 md:p-8 inline-block min-w-[280px]">
              <div className="text-7xl md:text-8xl font-black bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent leading-none">{percentage}%</div>
              <div className="text-2xl font-bold text-white mt-3">{result.score} / {result.totalQuestions}</div>
              <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${grade.bg} ${grade.color}`}>{grade.label}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-2xl font-bold text-amber-400">{result.subjectStats.lafzy.correct}/40</div>
                <div className="text-xs text-slate-400">لفظي</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-400">{result.subjectStats.kammi.correct}/40</div>
                <div className="text-xs text-slate-400">كمي</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-2xl font-bold text-white">{minutes}:{String(seconds).padStart(2, '0')}</div>
                <div className="text-xs text-slate-400">الوقت</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-lg"><BookOpen className="w-6 h-6 text-amber-700" /></div>
              <div><div className="font-bold text-slate-900">القسم اللفظي</div></div>
              <div className="mr-auto text-2xl font-black text-amber-600">{lafzyPct}%</div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full" style={{ width: `${lafzyPct}%` }} /></div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg"><Calculator className="w-6 h-6 text-blue-700" /></div>
              <div><div className="font-bold text-slate-900">القسم الكمي</div></div>
              <div className="mr-auto text-2xl font-black text-blue-600">{kammiPct}%</div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full" style={{ width: `${kammiPct}%` }} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/')} className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Home className="w-5 h-5" /> الرئيسية
          </button>
          <button onClick={onRestart} className="bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" /> اختبار جديد
          </button>
        </div>
      </div>
    </div>
  );
}
