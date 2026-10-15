import { Fragment } from 'react'

type SplitWordsProps = {
  text: string
  wordClassName?: string | undefined
  /** An inner span per word, for a hover response that must not share the word's element (plan 6 §7). */
  innerClassName?: string | undefined
}

export function SplitWords({ text, wordClassName, innerClassName }: SplitWordsProps) {
  const words = text.split(' ')
  return words.map((word, position) => (
    <Fragment key={`${position}:${word}`}>
      <span className={wordClassName}>
        {innerClassName ? <span className={innerClassName}>{word}</span> : word}
      </span>
      {position < words.length - 1 && ' '}
    </Fragment>
  ))
}
