export function getMissingWordLabels(input: {
  existingLabels: readonly string[]
  desiredLabels: readonly string[]
}): string[] {
  const existingLabels: Set<string> = new Set(input.existingLabels)
  const seenLabels: Set<string> = new Set()
  const missingLabels: string[] = []

  for (const label of input.desiredLabels) {
    if (existingLabels.has(label) || seenLabels.has(label))
      continue

    seenLabels.add(label)
    missingLabels.push(label)
  }

  return missingLabels
}
