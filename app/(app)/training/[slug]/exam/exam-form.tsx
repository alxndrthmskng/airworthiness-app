'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Answer {
  id: string
  answer_text: string
}

interface Question {
  id: string
  question_text: string
  order_index: number
  answers: Answer[]
}

interface Props {
  questions: Question[]
  examId: string
  passScore: number
  courseSlug: string
  courseId: string
}

export function ExamForm({ questions, examId, passScore, courseSlug, courseId }: Props) {
  const router = useRouter()

  const [selected, setSelected] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correctCount: number
    total: number
  } | null>(null)

  const allAnswered = questions.every(q => selected[q.id])

  async function handleSubmit() {
    if (!allAnswered) return
    setSubmitting(true)

    const res = await fetch('/api/training/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id: examId,
        course_id: courseId,
        answers: selected,
      }),
    })

    if (!res.ok) {
      setSubmitting(false)
      return
    }

    const data = await res.json()
    setResult({
      score: data.score,
      passed: data.passed,
      correctCount: data.correctCount,
      total: data.total,
    })
    setSubmitting(false)
  }

  if (result) {
    return (
      <div className={`rounded-xl border p-8 text-center ${
        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="text-5xl mb-4">{result.passed ? '🎉' : '😔'}</div>
        <h2 className={`text-lg font-semibold mb-2 ${
          result.passed ? 'text-green-800' : 'text-red-800'
        }`}>
          {result.passed ? 'You passed!' : 'Not quite'}
        </h2>
        <p className={`text-lg mb-1 ${
          result.passed ? 'text-green-700' : 'text-red-700'
        }`}>
          Your score: <strong>{result.score}%</strong>
        </p>
        <p className={`text-sm mb-6 ${
          result.passed ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.correctCount} out of {result.total} correct · Pass mark: {passScore}%
        </p>

        {result.passed ? (
          <Button onClick={() => router.push('/dashboard')}>
            View your certificate →
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              Review the course material and try again.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/training/${courseSlug}`)}>
              Back to course
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id} className="bg-card rounded-xl border p-6">
          <p className="font-semibold text-foreground mb-4">
            {index + 1}. {question.question_text}
          </p>
          <div className="space-y-2">
            {question.answers.map(answer => (
              <label
                key={answer.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selected[question.id] === answer.id
                    ? 'border-foreground bg-muted'
                    : 'border-border hover:bg-muted'
                  }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={selected[question.id] === answer.id}
                  onChange={() => setSelected(prev => ({
                    ...prev,
                    [question.id]: answer.id
                  }))}
                  className="accent-foreground"
                />
                <span className="text-foreground">{answer.answer_text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="text-sm text-muted-foreground text-center">
        {Object.keys(selected).length} of {questions.length} questions answered
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
      >
        {submitting
          ? 'Submitting...'
          : !allAnswered
          ? 'Answer all questions to submit'
          : 'Submit exam'
        }
      </Button>
    </div>
  )
}
