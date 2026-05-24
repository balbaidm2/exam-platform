-- ============================================
-- إعداد قاعدة بيانات اختبار القدرات والتحصيلي
-- ============================================
-- انسخ هذا الملف بالكامل والصقه في:
-- Supabase → SQL Editor → New Query → Run

-- جدول النتائج
CREATE TABLE IF NOT EXISTS exam_results (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- بيانات الطالب
  student_name TEXT NOT NULL,
  student_id TEXT,
  student_class TEXT,

  -- نوع الاختبار
  exam_type TEXT NOT NULL CHECK (exam_type IN ('qudurat', 'tahsili')),

  -- النتيجة الإجمالية
  total_score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,

  -- التفصيل (JSON)
  subject_stats JSONB NOT NULL,
  answers JSONB NOT NULL,

  -- الوقت المستغرق بالثواني
  time_spent INTEGER NOT NULL,

  -- معرّف الجلسة (لتمييز محاولات نفس الطالب)
  session_id TEXT
);

-- فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_student_name ON exam_results(student_name);
CREATE INDEX IF NOT EXISTS idx_exam_type ON exam_results(exam_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON exam_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_class ON exam_results(student_class);

-- ============================================
-- إعدادات الأمان (Row Level Security)
-- ============================================

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بإضافة نتائج (للطلاب)
CREATE POLICY "Anyone can insert results"
  ON exam_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- السماح للجميع بقراءة النتائج
-- (في الإنتاج، يُنصح بتقييد القراءة للمعلم فقط عبر authentication)
CREATE POLICY "Anyone can read results"
  ON exam_results
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- جدول إعدادات المعلم (اختياري)
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- مثال: كلمة مرور لوحة المعلم
INSERT INTO teacher_settings (setting_key, setting_value)
VALUES ('teacher_password', 'teacher123')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- تم الإعداد بنجاح
-- ============================================
