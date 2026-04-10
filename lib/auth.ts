import NextAuth from 'next-auth'
import Nodemailer from 'next-auth/providers/nodemailer'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_HOST || 'smtp.resend.com',
        port: Number(process.env.EMAIL_PORT || 587),
        auth: {
          user: process.env.EMAIL_USER || 'resend',
          pass: process.env.EMAIL_PASS || '',
        },
      },
      from: process.env.EMAIL_FROM || 'Airworthiness <noreply@airworthiness.limited>',
    }),
  ],
  pages: {
    signIn: '/',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  session: {
    strategy: 'database',
  },
})
