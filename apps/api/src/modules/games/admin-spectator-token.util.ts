import { timingSafeEqual } from 'node:crypto'

export function isAdminSpectatorTokenValid(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  if (!provided || !expected)
    return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length)
    return false
  return timingSafeEqual(a, b)
}
