import { getMissingWordLabels } from './words-seed.logic'

describe('getMissingWordLabels', () => {
  it('returns every desired label when the category is empty', () => {
    const inputDesiredLabels: readonly string[] = ['Chat', 'Chien']
    const expectedLabels: string[] = ['Chat', 'Chien']

    const actualLabels: string[] = getMissingWordLabels({
      existingLabels: [],
      desiredLabels: inputDesiredLabels,
    })

    expect(actualLabels).toEqual(expectedLabels)
  })

  it('returns only labels that are not already stored', () => {
    const inputExistingLabels: readonly string[] = ['Chat']
    const inputDesiredLabels: readonly string[] = ['Chat', 'Chien']
    const expectedLabels: string[] = ['Chien']

    const actualLabels: string[] = getMissingWordLabels({
      existingLabels: inputExistingLabels,
      desiredLabels: inputDesiredLabels,
    })

    expect(actualLabels).toEqual(expectedLabels)
  })

  it('returns an empty list when every desired label already exists', () => {
    const actualLabels: string[] = getMissingWordLabels({
      existingLabels: ['Chat', 'Chien'],
      desiredLabels: ['Chat'],
    })

    expect(actualLabels).toEqual([])
  })

  it('does not drop a stored word that is absent from the desired list', () => {
    const actualLabels: string[] = getMissingWordLabels({
      existingLabels: ['Chat', 'Ancien'],
      desiredLabels: ['Chat', 'Chien'],
    })

    expect(actualLabels).toEqual(['Chien'])
  })

  it('deduplicates desired labels while keeping the first spelling', () => {
    const actualLabels: string[] = getMissingWordLabels({
      existingLabels: [],
      desiredLabels: ['Chat', 'Chat', 'Chien'],
    })

    expect(actualLabels).toEqual(['Chat', 'Chien'])
  })
})
