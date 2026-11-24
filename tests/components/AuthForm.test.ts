import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, expect, it, vi } from 'vitest'
import AuthForm from '../../app/components/AuthForm.vue'

const { signIn, signUp } = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }))

mockNuxtImport('authClient', () => ({
  signIn: { email: signIn },
  signUp: { email: signUp },
}))

beforeEach(() => {
  signIn.mockReset()
  signUp.mockReset()
})

it('displays a useful error for a rejected login', async () => {
  signIn.mockResolvedValue({ error: { status: 401 } })
  const view = await mountSuspended(AuthForm)
  await view.get('input[type="email"]').setValue('reader@example.test')
  await view.get('input[type="password"]').setValue('wrong-password')
  await view.get('form').trigger('submit')
  await flushPromises()

  expect(signIn).toHaveBeenCalledWith({ email: 'reader@example.test', password: 'wrong-password' })
  expect(view.get('[role="alert"]').text()).toBe('Sprawdź adres e-mail i hasło.')
})

it('rejects mismatched passwords before registration', async () => {
  const view = await mountSuspended(AuthForm, { props: { register: true, registrationAvailable: true } })
  const [password, confirmation] = view.findAll('input[type="password"]')
  await password!.setValue('first-test-password')
  await confirmation!.setValue('different-test-password')
  await view.get('form').trigger('submit')

  expect(view.get('[role="alert"]').text()).toBe('Hasła muszą być takie same.')
  expect(signUp).not.toHaveBeenCalled()
})
