import { Fragment } from 'react'

type SplitWordsProps = {
  text: string
  wordClassName?: string | undefined
}

export function SplitWords({ text, wordClassName }: SplitWordsProps) {
  const words = text.split(' ')
  return words.map((word, position) => (
    <Fragment key={`${position}:${word}`}>
      <span className={wordClassName}>{word}</span>
      {position < words.length - 1 && ' '}
    </Fragment>
  ))
}
