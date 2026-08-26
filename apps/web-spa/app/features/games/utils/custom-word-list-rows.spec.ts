import { describe, expect, it } from 'vitest'
import { CUSTOM_WORD_MAX_LENGTH, CUSTOM_WORDS_MAX_COUNT } from '../types'
import { addCustomWordsFromDraft } from './custom-word-list-rows'

describe('addCustomWordsFromDraft', () => {
  it('adds comma-separated labels to an empty list', () => {
    const inputExistingWords: string[] = []
    const inputDraft: string = 'chat, chien'
    const expectedWords: string[] = ['chat', 'chien']

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toEqual(expectedWords)
  })

  it('adds newline-separated labels including CRLF', () => {
    const inputExistingWords: string[] = []
    const inputDraft: string = 'chat\r\nchien'
    const expectedWords: string[] = ['chat', 'chien']

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toEqual(expectedWords)
  })

  it('drops empties and keeps the first fr-FR spelling of a duplicate', () => {
    const inputExistingWords: string[] = []
    const inputDraft: string = 'Chat,\n,CHIEN\nchat'
    const expectedWords: string[] = ['Chat', 'CHIEN']

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toEqual(expectedWords)
  })

  it('skips tokens longer than 40 characters', () => {
    const tooLongLabel: string = 'a'.repeat(CUSTOM_WORD_MAX_LENGTH + 1)
    const inputExistingWords: string[] = []
    const inputDraft: string = `chat,${tooLongLabel},chien`
    const expectedWords: string[] = ['chat', 'chien']

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toEqual(expectedWords)
  })

  it('keeps an existing label longer than 40 characters', () => {
    const existingLongLabel: string = 'b'.repeat(CUSTOM_WORD_MAX_LENGTH + 1)
    const inputExistingWords: string[] = [existingLongLabel]
    const inputDraft: string = 'chat'
    const expectedWords: string[] = [existingLongLabel, 'chat']

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toEqual(expectedWords)
  })

  it('caps the merged list at 400 and keeps existing then earliest new uniques', () => {
    const inputExistingWords: string[] = Array.from(
      { length: CUSTOM_WORDS_MAX_COUNT - 1 },
      (_, index: number) => `w${index}`,
    )
    const inputDraft: string = 'alpha, bravo, charlie'

    const actualWords: string[] = addCustomWordsFromDraft(inputExistingWords, inputDraft)

    expect(actualWords).toHaveLength(CUSTOM_WORDS_MAX_COUNT)
    expect(actualWords.slice(0, inputExistingWords.length)).toEqual(inputExistingWords)
    expect(actualWords[CUSTOM_WORDS_MAX_COUNT - 1]).toBe('alpha')
  })
})
