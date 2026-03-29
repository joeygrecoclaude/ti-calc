import { evaluate } from 'mathjs'

function formatNumber(num: number): string {
  if (!isFinite(num)) return 'ERR: undefined'
  const abs = Math.abs(num)
  // Switch to scientific notation for very large or very small values
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-6)) {
    return num.toExponential(9).replace(/\.?0+e/, 'e')
  }
  // Round to 10 significant figures, strip trailing zeros
  return String(parseFloat(num.toPrecision(10)))
}

export function evalExpression(expr: string): string {
  try {
    const result = evaluate(expr)
    if (result === undefined || result === null) return 'ERR: undefined'
    if (typeof result === 'function') return 'ERR: undefined'
    const num = typeof result === 'number' ? result : Number(result)
    if (isNaN(num)) return 'ERR: undefined'
    if (!isFinite(num)) return 'ERR: overflow'
    return formatNumber(num)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : ''
    if (msg.includes('divide by zero') || msg.includes('division by zero')) return 'ERR: division by zero'
    if (msg.includes('undefined symbol') || msg.includes('undefined')) return 'ERR: undefined'
    return 'ERR: syntax'
  }
}
