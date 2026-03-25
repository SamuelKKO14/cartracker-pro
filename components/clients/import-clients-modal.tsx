'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle, Check, Download, FileText, Loader2, Sparkles, Upload,
} from 'lucide-react'

interface ParsedRow {
  name: string
  phone: string | null
  email: string | null
  budget: number | null
  criteria: string | null
  notes: string | null
  billing_type: string
  error: string | null
}

const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  nom: 'name', name: 'name',
  'téléphone': 'phone', telephone: 'phone', phone: 'phone', tel: 'phone',
  email: 'email', mail: 'email',
  budget: 'budget',
  'critères': 'criteria', criteres: 'criteria', criteria: 'criteria', recherche: 'criteria',
  notes: 'notes',
  facturation: 'billing_type', billing: 'billing_type',
}

function detectSeparator(line: string): string {
  const counts = { ',': 0, ';': 0, '|': 0, '\t': 0 }
  for (const ch of line) {
    if (ch in counts) counts[ch as keyof typeof counts]++
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function splitLine(line: string, sep: string): string[] {
  return line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, '').trim())
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const sep = detectSeparator(lines[0])
  const headers = splitLine(lines[0], sep).map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))

  const fieldMap: number[] = headers.map(h => {
    const key = COLUMN_MAP[h]
    return key ? Object.keys({ name: 0, phone: 1, email: 2, budget: 3, criteria: 4, notes: 5, billing_type: 6, error: 7 }).indexOf(key) : -1
  })

  return lines.slice(1).map(line => {
    const cells = splitLine(line, sep)
    const row: ParsedRow = { name: '', phone: null, email: null, budget: null, criteria: null, notes: null, billing_type: 'search', error: null }

    headers.forEach((h, i) => {
      const normalized = h.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const field = COLUMN_MAP[normalized] ?? COLUMN_MAP[h]
      if (!field) return
      const val = cells[i] ?? ''
      if (!val) return

      if (field === 'budget') {
        const n = parseInt(val.replace(/\D/g, ''))
        if (!isNaN(n)) row.budget = n
      } else if (field === 'billing_type') {
        row.billing_type = val.toLowerCase().includes('mensuel') || val === 'monthly' ? 'monthly' : 'search'
      } else if (field === 'name' || field === 'phone' || field === 'email' || field === 'criteria' || field === 'notes') {
        row[field] = val
      }
    })

    if (!row.name) row.error = 'Nom manquant'
    return row
  }).filter(r => r.name || r.phone || r.email) // skip fully empty rows
}

function fromAIData(items: unknown[]): ParsedRow[] {
  return items.map(item => {
    const i = item as Record<string, unknown>
    const row: ParsedRow = {
      name: typeof i.name === 'string' ? i.name : '',
      phone: typeof i.phone === 'string' ? i.phone : null,
      email: typeof i.email === 'string' ? i.email : null,
      budget: typeof i.budget === 'number' ? i.budget : null,
      criteria: typeof i.criteria === 'string' ? i.criteria : null,
      notes: typeof i.notes === 'string' ? i.notes : null,
      billing_type: 'search',
      error: null,
    }
    if (!row.name) row.error = 'Nom manquant'
    return row
  })
}

interface ImportClientsModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

type Step = 'input' | 'preview'

export function ImportClientsModal({ open, onClose, onImported }: ImportClientsModalProps) {
  const [tab, setTab] = useState<'csv' | 'text'>('csv')
  const [step, setStep] = useState<Step>('input')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pasteText, setPasteText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState<{ success: number; errors: number } | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('input')
    setRows([])
    setSelected(new Set())
    setPasteText('')
    setAiError(null)
    setImportDone(null)
    setImportProgress(0)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function loadRows(parsed: ParsedRow[]) {
    setRows(parsed)
    const validIdxs = new Set(parsed.map((_, i) => i).filter(i => !parsed[i].error))
    setSelected(validIdxs)
    setStep('preview')
  }

  function handleCSVFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setAiError('Aucun client trouvé dans le fichier. Vérifiez le format.')
        return
      }
      loadRows(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleCSVFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) handleCSVFile(file)
  }

  async function handleAIAnalyze() {
    if (!pasteText.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/analyze-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAiError(json.error ?? 'Erreur inconnue')
        return
      }
      const parsed = fromAIData(json.data)
      if (parsed.length === 0) {
        setAiError('Aucun client extrait. Essayez avec un texte plus détaillé.')
        return
      }
      loadRows(parsed)
    } catch {
      setAiError('Erreur réseau')
    } finally {
      setAiLoading(false)
    }
  }

  function toggleRow(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function toggleAll() {
    const validIdxs = rows.map((_, i) => i).filter(i => !rows[i].error)
    if (selected.size === validIdxs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(validIdxs))
    }
  }

  async function handleImport() {
    const toImport = Array.from(selected).map(i => rows[i]).filter(r => !r.error && r.name)
    if (toImport.length === 0) return

    setImporting(true)
    setImportProgress(0)
    let success = 0
    let errors = 0

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = toImport.map(r => ({
        user_id: user.id,
        name: r.name,
        phone: r.phone || null,
        email: r.email || null,
        budget: r.budget,
        criteria: r.criteria || null,
        notes: r.notes || null,
        billing_type: r.billing_type,
      }))

      // Batch insert in chunks of 50
      const CHUNK = 50
      for (let i = 0; i < payload.length; i += CHUNK) {
        const chunk = payload.slice(i, i + CHUNK)
        const { error } = await supabase.from('clients').insert(chunk)
        if (error) errors += chunk.length
        else success += chunk.length
        setImportProgress(Math.round(((i + chunk.length) / payload.length) * 100))
      }

      setImportDone({ success, errors })
      if (success > 0) {
        setTimeout(() => {
          handleClose()
          onImported()
        }, 1500)
      }
    } finally {
      setImporting(false)
    }
  }

  const validSelected = Array.from(selected).filter(i => !rows[i]?.error).length
  const validRows = rows.filter(r => !r.error)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-400" />
            Importer des clients
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">

          {/* ── STEP 1: INPUT ── */}
          {step === 'input' && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-[#0a0d14] rounded-lg border border-[#1a1f2e]">
                {([['csv', '📄 Fichier CSV'], ['text', '📋 Coller du texte']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setTab(key); setAiError(null) }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      tab === key
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'csv' && (
                <div className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-orange-500 bg-orange-900/10'
                        : 'border-[#2a2f3e] bg-[#0a0d14] hover:border-[#3a3f4e]'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-500" />
                    <p className="text-sm text-gray-400">
                      Glissez un fichier <span className="text-gray-200 font-medium">.csv</span> ici
                    </p>
                    <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                      Parcourir
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileInput} />
                  </div>

                  {/* Format example */}
                  <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#1a1f2e] space-y-2">
                    <p className="text-xs font-medium text-gray-400">Format attendu :</p>
                    <pre className="text-xs text-gray-400 overflow-x-auto">
{`nom,téléphone,email,budget,critères
Jean Dupont,0612345678,jean@email.com,25000,Golf 7 automatique diesel
Marie Martin,0698765432,,15000,Citadine essence`}
                    </pre>
                    <p className="text-xs text-gray-500">Séparateurs acceptés : <code className="text-orange-400">,</code> <code className="text-orange-400">;</code> <code className="text-orange-400">|</code> <code className="text-orange-400">tabulation</code></p>
                  </div>

                  {aiError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {aiError}
                    </div>
                  )}
                </div>
              )}

              {tab === 'text' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder={`Colle ici ta liste de clients, une ligne par client. Formats acceptés :
- Prénom Nom, 0612345678, email@exemple.com
- Prénom Nom | 0612345678 | budget
- ou toute autre liste...`}
                    value={pasteText}
                    onChange={e => { setPasteText(e.target.value); setAiError(null) }}
                    className="min-h-[200px] text-sm font-mono"
                  />

                  {aiError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {aiError}
                    </div>
                  )}

                  <Button
                    onClick={handleAIAnalyze}
                    disabled={aiLoading || !pasteText.trim()}
                    className="w-full"
                  >
                    {aiLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
                      : <><Sparkles className="w-4 h-4" /> Analyser avec l&apos;IA</>
                    }
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: PREVIEW ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={reset}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ← Retour
                  </button>
                  <span className="text-sm text-gray-400">
                    <span className="text-gray-200 font-medium">{validSelected}</span> client{validSelected !== 1 ? 's' : ''} sélectionné{validSelected !== 1 ? 's' : ''}
                    {rows.some(r => r.error) && (
                      <span className="text-red-400 ml-2">· {rows.filter(r => r.error).length} erreur{rows.filter(r => r.error).length !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {selected.size === validRows.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0a0d14] border-b border-[#1a1f2e]">
                      <tr>
                        <th className="w-10 p-3"><Checkbox checked={selected.size === validRows.length && validRows.length > 0} onCheckedChange={toggleAll} /></th>
                        <th className="p-3 text-left font-medium text-gray-400">Nom</th>
                        <th className="p-3 text-left font-medium text-gray-400">Téléphone</th>
                        <th className="p-3 text-left font-medium text-gray-400">Email</th>
                        <th className="p-3 text-left font-medium text-gray-400">Budget</th>
                        <th className="p-3 text-left font-medium text-gray-400">Critères</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[#1a1f2e] last:border-0 transition-colors ${
                            row.error
                              ? 'bg-red-900/10'
                              : selected.has(i)
                              ? 'bg-[#0d1117]'
                              : 'bg-[#0d1117] opacity-50'
                          }`}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={selected.has(i)}
                              disabled={!!row.error}
                              onCheckedChange={() => !row.error && toggleRow(i)}
                            />
                          </td>
                          <td className="p-3">
                            {row.error ? (
                              <span className="flex items-center gap-1.5 text-red-400">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {row.error}
                              </span>
                            ) : (
                              <span className="text-gray-200 font-medium">{row.name}</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-400">{row.phone ?? '—'}</td>
                          <td className="p-3 text-gray-400 max-w-[160px] truncate">{row.email ?? '—'}</td>
                          <td className="p-3 text-gray-400">{row.budget != null ? `${row.budget.toLocaleString('fr-FR')} €` : '—'}</td>
                          <td className="p-3 text-gray-400 max-w-[200px] truncate">{row.criteria ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress */}
              {importing && (
                <div className="space-y-1.5">
                  <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500">Import en cours… {importProgress}%</p>
                </div>
              )}

              {/* Result */}
              {importDone && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  importDone.errors === 0
                    ? 'bg-green-900/20 border border-green-800/50 text-green-400'
                    : 'bg-yellow-900/20 border border-yellow-800/50 text-yellow-400'
                }`}>
                  <Check className="w-4 h-4 shrink-0" />
                  {importDone.success > 0 && `${importDone.success} client(s) importé(s) avec succès !`}
                  {importDone.errors > 0 && ` ${importDone.errors} erreur(s).`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && !importDone && (
          <div className="flex items-center justify-between pt-4 border-t border-[#1a1f2e] shrink-0">
            <Button variant="secondary" onClick={handleClose} disabled={importing}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validSelected === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {importing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours…</>
                : <><Download className="w-4 h-4" /> Importer {validSelected} client{validSelected !== 1 ? 's' : ''}</>
              }
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
