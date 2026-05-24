import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ متغيرات Supabase غير معرّفة. تأكد من إنشاء ملف .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============== دوال مساعدة ==============

/**
 * حفظ نتيجة اختبار
 */
export async function saveExamResult(result) {
  const { data, error } = await supabase
    .from('exam_results')
    .insert([{
      student_name: result.studentName,
      student_id: result.studentId || null,
      student_class: result.studentClass || null,
      exam_type: result.examType,
      total_score: result.score,
      total_questions: result.totalQuestions,
      percentage: (result.score / result.totalQuestions * 100).toFixed(2),
      subject_stats: result.subjectStats,
      answers: result.answers,
      time_spent: result.timeSpent,
      session_id: result.sessionId || crypto.randomUUID(),
    }])
    .select();

  if (error) {
    console.error('خطأ في حفظ النتيجة:', error);
    throw error;
  }
  return data;
}

/**
 * جلب كل النتائج (للوحة المعلم)
 */
export async function getAllResults(examType = null) {
  let query = supabase
    .from('exam_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (examType) {
    query = query.eq('exam_type', examType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * جلب نتائج طالب محدد
 */
export async function getStudentResults(studentName, examType = null) {
  let query = supabase
    .from('exam_results')
    .select('*')
    .eq('student_name', studentName)
    .order('created_at', { ascending: false });

  if (examType) {
    query = query.eq('exam_type', examType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * إحصائيات عامة
 */
export async function getStatistics(examType = null) {
  let query = supabase.from('exam_results').select('*');
  if (examType) query = query.eq('exam_type', examType);

  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      totalAttempts: 0,
      uniqueStudents: 0,
      averageScore: 0,
      averagePercentage: 0,
    };
  }

  const uniqueStudents = new Set(data.map(r => r.student_name)).size;
  const avgScore = data.reduce((s, r) => s + r.total_score, 0) / data.length;
  const avgPct = data.reduce((s, r) => s + parseFloat(r.percentage), 0) / data.length;

  return {
    totalAttempts: data.length,
    uniqueStudents,
    averageScore: avgScore.toFixed(1),
    averagePercentage: avgPct.toFixed(1),
  };
}

/**
 * حذف نتيجة (للمعلم فقط)
 */
export async function deleteResult(id) {
  const { error } = await supabase
    .from('exam_results')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * تصدير النتائج كـ CSV
 */
export function exportToCSV(results, examType) {
  if (!results || results.length === 0) return;

  const headers = examType === 'qudurat'
    ? ['اسم الطالب', 'الصف', 'التاريخ', 'الدرجة', 'النسبة %', 'لفظي', 'كمي', 'الوقت (دقيقة)']
    : ['اسم الطالب', 'الصف', 'التاريخ', 'الدرجة', 'النسبة %', 'فيزياء', 'كيمياء', 'أحياء', 'رياضيات', 'الوقت (دقيقة)'];

  const rows = results.map(r => {
    const date = new Date(r.created_at).toLocaleDateString('ar-SA');
    const timeMin = Math.round(r.time_spent / 60);
    const baseRow = [
      r.student_name,
      r.student_class || '-',
      date,
      `${r.total_score}/${r.total_questions}`,
      r.percentage,
    ];

    if (examType === 'qudurat') {
      const lafzy = r.subject_stats.lafzy || { correct: 0, total: 40 };
      const kammi = r.subject_stats.kammi || { correct: 0, total: 40 };
      return [...baseRow, `${lafzy.correct}/40`, `${kammi.correct}/40`, timeMin];
    } else {
      const stats = r.subject_stats;
      return [
        ...baseRow,
        `${stats.physics?.correct || 0}/15`,
        `${stats.chemistry?.correct || 0}/15`,
        `${stats.biology?.correct || 0}/15`,
        `${stats.math?.correct || 0}/15`,
        timeMin,
      ];
    }
  });

  // BOM لدعم العربية في Excel
  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `نتائج_${examType === 'qudurat' ? 'القدرات' : 'التحصيلي'}_${new Date().toISOString().split('T')[0]}.csv`;
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
