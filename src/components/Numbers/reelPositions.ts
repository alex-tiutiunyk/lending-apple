const firstLockAt = 0.55

export function reelPositions(progress: number, finalDigits: readonly number[]) {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const columnCount = finalDigits.length

  return finalDigits.map((digit, column) => {
    const lockAt = firstLockAt + ((1 - firstLockAt) * (column + 1)) / columnCount
    const columnProgress = Math.min(1, clampedProgress / lockAt)
    const fullTurns = 2 + column
    return ((fullTurns * 10 + digit) * columnProgress) % 10
  })
}
