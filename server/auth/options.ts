import type { BetterAuthOptions } from 'better-auth'
import { emailTasks } from './email'

export function authOptions(production: boolean, sendEmail?: (to: string, subject: string, text: string) => Promise<void>) {
  return {
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      disableSignUp: production && !sendEmail,
      requireEmailVerification: production,
      revokeSessionsOnPasswordReset: true,
      ...(sendEmail && {
        async sendResetPassword({ user, url }) {
          await sendEmail(user.email, 'Zmień hasło do ContentCheck AI', 'Ustaw nowe hasło: ' + url)
        },
      }),
    },
    ...(sendEmail && {
      emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        async sendVerificationEmail({ user, url }) {
          await sendEmail(user.email, 'Potwierdź adres w ContentCheck AI', 'Potwierdź adres e-mail: ' + url)
        },
      },
    }),
    session: { disableSessionRefresh: true },
    rateLimit: {
      enabled: true,
      storage: 'database' as const,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 600, max: 3 },
        '/request-password-reset': { window: 600, max: 3 },
        '/send-verification-email': { window: 600, max: 3 },
      },
    },
    advanced: {
      useSecureCookies: production,
      ...(sendEmail && { backgroundTasks: { handler: (task: Promise<unknown>) => emailTasks.getStore()?.(task) } }),
      ipAddress: {
        ipAddressHeaders: [production && process.env.VERCEL ? 'x-vercel-forwarded-for' : 'x-contentcheck-client-ip'],
      },
    },
  } satisfies BetterAuthOptions
}
