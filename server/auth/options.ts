export function authOptions(production: boolean) {
  return {
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      disableSignUp: production,
      requireEmailVerification: production,
    },
    session: { disableSessionRefresh: true },
    rateLimit: {
      enabled: true,
      storage: 'database' as const,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 600, max: 3 },
      },
    },
    advanced: {
      useSecureCookies: production,
      ipAddress: {
        ipAddressHeaders: [production && process.env.VERCEL ? 'x-vercel-forwarded-for' : 'x-contentcheck-client-ip'],
      },
    },
  }
}
