import { useState, useRef, useEffect, useCallback } from 'react'
import { evalExpression } from './eval'

interface HistoryEntry {
  expression: string
  result: string
}

const OPERATOR_START = /^[+\-*/%^]/

const BUTTONS = [
  ['sin(', 'cos(', 'tan(', '(', ')'],
  ['sqrt(', 'log(', 'ln(', 'Ans', '^'],
  ['7', '8', '9', '/', '*'],
  ['4', '5', '6', '+', '-'],
  ['1', '2', '3', '.', '='],
  ['', '0', '', '', ''],
]

const DARK = {
  page:        'bg-gray-950',
  panel:       'border-gray-700',
  header:      'bg-gray-900 border-gray-700 text-gray-500',
  tape:        'bg-gray-950',
  tapeEmpty:   'text-gray-600',
  tapeHover:   'hover:bg-gray-800',
  expr:        'text-gray-400',
  equals:      'text-gray-600',
  result:      'text-green-300',
  error:       'text-red-700',
  ansBar:      'bg-gray-900 border-gray-800 text-gray-500',
  inputRow:    'bg-gray-900 border-gray-700',
  prompt:      'text-green-500',
  inputText:   'text-green-400 placeholder-gray-600 caret-green-400',
  btnGrid:     'bg-gray-900 border-gray-700',
  btnDigit:    'bg-gray-700 hover:bg-gray-600 text-white',
  btnOp:       'bg-gray-800 hover:bg-gray-700 text-green-400',
  btnBase:     'bg-gray-800 hover:bg-gray-700 text-green-400',
  btnFn:       'bg-gray-800 hover:bg-gray-700 text-purple-400',
  btnCE:       'bg-gray-700 hover:bg-gray-600 text-gray-300',
  btnC:        'bg-red-900 hover:bg-red-800 text-red-300',
  btnEq:       'bg-green-700 hover:bg-green-600 text-white',
  toggle:      'text-gray-500 hover:text-gray-300',
}

const LIGHT = {
  page:        'bg-gray-100',
  panel:       'border-gray-300',
  header:      'bg-white border-gray-200 text-gray-400',
  tape:        'bg-white',
  tapeEmpty:   'text-gray-400',
  tapeHover:   'hover:bg-gray-100',
  expr:        'text-gray-600',
  equals:      'text-gray-400',
  result:      'text-green-700',
  error:       'text-red-500',
  ansBar:      'bg-gray-50 border-gray-200 text-gray-400',
  inputRow:    'bg-gray-50 border-gray-200',
  prompt:      'text-green-600',
  inputText:   'text-gray-900 placeholder-gray-400 caret-green-600',
  btnGrid:     'bg-gray-50 border-gray-200',
  btnDigit:    'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-semibold',
  btnOp:       'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200',
  btnBase:     'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200',
  btnFn:       'bg-white hover:bg-purple-50 text-purple-700 border border-gray-200',
  btnCE:       'bg-white hover:bg-gray-100 text-gray-500 border border-gray-200',
  btnC:        'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
  btnEq:       'bg-green-600 hover:bg-green-500 text-white',
  toggle:      'text-gray-400 hover:text-gray-600',
}

export default function App() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [input, setInput] = useState('')
  const [ans, setAns] = useState<string | null>(null)
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [dark, setDark] = useState(true)

  const t = dark ? DARK : LIGHT

  const inputRef = useRef<HTMLInputElement>(null)
  const tapeEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    tapeEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const focusInput = useCallback(() => {
    if (!isTouch()) inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(() => {
    let expr = input.trim()
    if (!expr) return

    if (OPERATOR_START.test(expr) && ans !== null) {
      expr = `Ans${expr}`
    }

    const resolvedExpr = ans !== null ? expr.replace(/\bAns\b/g, `(${ans})`) : expr
    const result = evalExpression(resolvedExpr)

    setHistory(prev => [...prev, { expression: expr, result }])

    if (!result.startsWith('ERR')) {
      setAns(result)
    }

    setInput('')
    setHistoryIndex(null)
    setDraft('')
  }, [input, ans])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInput('')
      setHistoryIndex(null)
      setDraft('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const expressions = history.map(h => h.expression)
      if (expressions.length === 0) return
      if (historyIndex === null) {
        setDraft(input)
        setHistoryIndex(expressions.length - 1)
        setInput(expressions[expressions.length - 1])
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1)
        setInput(expressions[historyIndex - 1])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const expressions = history.map(h => h.expression)
      if (historyIndex === null) return
      if (historyIndex < expressions.length - 1) {
        setHistoryIndex(historyIndex + 1)
        setInput(expressions[historyIndex + 1])
      } else {
        setHistoryIndex(null)
        setInput(draft)
      }
    }
  }, [handleSubmit, history, historyIndex, input, draft])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setHistoryIndex(null)
  }, [])

  const handleButtonClick = useCallback((label: string) => {
    focusInput()
    if (label === '') return
    if (label === '=') { handleSubmit(); return }
    if (label === 'Clear All') {
      setHistory([]); setAns(null); setInput(''); setHistoryIndex(null); setDraft('')
      return
    }
    if (label === 'Clear Entry') { setInput(''); setHistoryIndex(null); setDraft(''); return }
    if (label === 'π') { setInput(prev => prev + 'pi'); return }
    setInput(prev => prev + label)
  }, [focusInput, handleSubmit])

  const btnClass = (label: string) => {
    const base = 'rounded py-2 text-xs font-medium select-none transition-colors cursor-pointer'
    if (label === '=') return `${base} ${t.btnEq}`
    if (label === 'Clear All') return `${base} ${t.btnC}`
    if (label === 'Clear Entry') return `${base} ${t.btnCE}`
    if (['sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'ln('].includes(label)) return `${base} ${t.btnFn}`
    if (/^[0-9]$/.test(label)) return `${base} ${t.btnDigit}`
    if (['+', '-', '*', '/', '^'].includes(label)) return `${base} ${t.btnOp}`
    return `${base} ${t.btnBase}`
  }

  return (
    <div
      className={`min-h-screen ${t.page} font-mono flex flex-col items-center justify-center p-4 transition-colors`}
      onClick={focusInput}
    >
      <div className={`w-full max-w-sm flex flex-col border ${t.panel} rounded-lg overflow-hidden shadow-xl`}>
        {/* Header */}
        <div className={`${t.header} px-4 py-2 text-xs border-b flex items-center justify-between select-none`}>
          <span>ti-calc</span>
          <button
            onMouseDown={e => { e.preventDefault(); setDark(d => !d) }}
            className={`${t.toggle} transition-colors text-xs cursor-pointer`}
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* History tape */}
        <div className={`${t.tape} overflow-y-auto px-4 py-3 h-48 space-y-1`}>
          {history.length === 0 && (
            <p className={`${t.tapeEmpty} text-xs select-none`}>No history yet.</p>
          )}
          {history.map((entry, i) => (
            <div
              key={i}
              className={`text-sm leading-relaxed cursor-pointer ${t.tapeHover} rounded px-1 -mx-1 transition-colors`}
              onClick={() => { setInput(entry.expression); setHistoryIndex(null); focusInput() }}
            >
              <span className={t.expr}>{entry.expression}</span>
              <span className={t.equals}> = </span>
              <span className={entry.result.startsWith('ERR') ? t.error : t.result}>
                {entry.result}
              </span>
            </div>
          ))}
          <div ref={tapeEndRef} />
        </div>

        {/* Ans indicator */}
        <div className={`${t.ansBar} px-4 py-1 text-xs border-t select-none h-6`}>
          {ans !== null && <span>Ans = {ans}</span>}
        </div>

        {/* Input row */}
        <div className={`${t.inputRow} border-t flex items-center px-4 py-3 gap-2`}>
          <span className={`${t.prompt} select-none`}>›</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent outline-none ${t.inputText} text-sm`}
            placeholder="e.g. 2+2, sqrt(9)"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            autoFocus
            inputMode="none"
            readOnly={/iPad|iPhone|iPod/.test(navigator.userAgent)}
          />
        </div>

        {/* Clear buttons */}
        <div className={`${t.btnGrid} border-t px-2 py-2 flex gap-1`}>
          {(['Clear All', 'Clear Entry'] as const).map(label => (
            <button
              key={label}
              onMouseDown={e => { e.preventDefault(); handleButtonClick(label) }}
              className={`flex-1 rounded py-2 text-xs font-medium select-none transition-colors cursor-pointer ${label === 'Clear All' ? t.btnC : t.btnCE}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Button grid */}
        <div className={`${t.btnGrid} border-t p-2 grid grid-cols-5 gap-1`}>
          {BUTTONS.flat().map((label, i) => {
            if (label === '') return <div key={i} />
            return (
              <button
                key={i}
                onMouseDown={e => { e.preventDefault(); handleButtonClick(label) }}
                className={btnClass(label)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
