/**
 * Phase 3 milestone post types and their data shapes.
 *
 * Each post type has:
 * - a unique key stored in posts.post_type
 * - a Zod-style validator (manual; we don't depend on zod)
 * - a renderer that takes the data payload and returns an object
 *   describing how to display the post card
 *
 * Adding a new post type means adding it here AND adding a render case
 * in components/post-card.tsx.
 */

export type PostType =
  | 'module_pass'
  | 'type_rating_added'
  | 'training_completed'

export interface PostTypeDescriptor {
  key: PostType
  label: string
  validate: (data: unknown) => { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isOptionalNumber = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'number' && v >= 0 && v <= 100)

export const POST_TYPES: Record<PostType, PostTypeDescriptor> = {
  module_pass: {
    key: 'module_pass',
    label: 'Module pass',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.module_id)) return { ok: false, error: 'module_id is required' }
      if (!isString(data.category)) return { ok: false, error: 'category is required' }
      if (!isOptionalNumber(data.mcq_score)) return { ok: false, error: 'mcq_score must be 0-100' }
      if (!isOptionalNumber(data.essay_score)) return { ok: false, error: 'essay_score must be 0-100' }
      return {
        ok: true,
        data: {
          module_id: data.module_id,
          category: data.category,
          mcq_score: data.mcq_score ?? null,
          essay_score: data.essay_score ?? null,
        },
      }
    },
  },
  type_rating_added: {
    key: 'type_rating_added',
    label: 'Type rating',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.rating)) return { ok: false, error: 'rating is required' }
      return { ok: true, data: { rating: data.rating } }
    },
  },
  training_completed: {
    key: 'training_completed',
    label: 'Training completed',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.training_slug)) return { ok: false, error: 'training_slug is required' }
      if (data.completion_date !== undefined && data.completion_date !== null && !isString(data.completion_date)) {
        return { ok: false, error: 'completion_date must be a string' }
      }
      return {
        ok: true,
        data: {
          training_slug: data.training_slug,
          completion_date: data.completion_date ?? null,
        },
      }
    },
  },
}

export function isValidPostType(type: string): type is PostType {
  return type in POST_TYPES
}
