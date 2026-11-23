export function useAccount() {
  return useState<{ id: string, name: string } | null>('account', () => null)
}
