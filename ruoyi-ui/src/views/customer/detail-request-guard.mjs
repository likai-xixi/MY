export function createLatestRequestGuard() {
  let sequence = 0

  return {
    begin(key) {
      sequence += 1
      return { sequence, key }
    },
    isCurrent(token, activeKey) {
      return Boolean(token) && token.sequence === sequence && token.key === activeKey
    },
    invalidate() {
      sequence += 1
    }
  }
}
