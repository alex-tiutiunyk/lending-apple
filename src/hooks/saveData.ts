type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

export function prefersSavedData() {
  return (navigator as NavigatorWithConnection).connection?.saveData === true
}
