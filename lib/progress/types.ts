export interface ModuleExamProgress {
  id: string
  user_id: string
  target_category: string
  module_id: string
  issue_date: string | null
  part_147_approval_number: string | null
  certificate_number: string | null
  mcq_score: number | null
  essay_score: number | null
  essay_score_2: number | null
  essay_split: boolean
  certificate_photo_path: string | null
  verification_status: 'unverified' | 'verified'
  verified_by: string | null
  verified_at: string | null
  is_btc: boolean
  is_equivalent: boolean
  equivalency_source: string | null
  created_at: string
  updated_at: string
}

// An exam row is either an MCQ exam or an Essay exam
// Essay modules produce two exam rows (one MCQ, one Essay)
export interface ExamRow {
  moduleId: string
  title: string
  examType: 'mcq' | 'essay'
  // Module 7A/7B essays can be split into two marks
  canSplitEssay: boolean
  progress: ModuleExamProgress | null
  equivalentFrom: {
    sourceModule: string
    sourceCategory: string
    description: string
  } | null
  isExpired: boolean
}
