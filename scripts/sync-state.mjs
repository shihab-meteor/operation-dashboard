#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const WORKDIR = '/data/.openclaw/workspace'
const DASH_REPO = '/tmp/operation-dashboard-repo'
const TASKS_PATH = `${WORKDIR}/operation-dashboard/tasks.json`
const STATUS_PATH_WORK = `${WORKDIR}/operation-dashboard/status.json`
const STATUS_PATH_REPO = `${DASH_REPO}/status.json`

function run(cmd, cwd = WORKDIR) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function fmtParis(dateMs) {
  const d = dateMs ? new Date(dateMs) : new Date()
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d).replace(',', '')
  return `${s.replaceAll('/', '-')} Europe/Paris`
}

function build() {
  const status = JSON.parse(run('openclaw status --json'))
  const sessions = status?.sessions?.recent || []
  const primary = sessions.find(s => s.key?.includes('telegram:direct:853523355')) || sessions[0] || {}

  const contextTokens = Number(primary.contextTokens || 272000)
  const used = Number(primary.totalTokens || 0)
  const pct = contextTokens ? Math.round((used / contextTokens) * 100) : null
  const context = contextTokens ? `${used}/${contextTokens} (${pct}%)` : 'n/a'

  const tasks = fs.existsSync(TASKS_PATH) ? JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8')) : []

  // Sub-agent approximation from session keys (OpenClaw CLI does not expose active subagent runs directly here)
  const subagentSessions = sessions
    .filter(s => String(s.key || '').includes(':subagent:'))
    .map(s => ({
      label: String(s.key).split(':subagent:')[1] || s.key,
      status: 'recent',
      task: `updated ${Math.round((s.age || 0) / 1000)}s ago`
    }))

  return {
    lastUpdated: fmtParis(primary.updatedAt || Date.now()),
    model: primary.model ? `openai-codex/${primary.model}` : 'openai-codex/gpt-5.3-codex',
    context,
    tokens: {
      in: String(primary.inputTokens ?? 'n/a'),
      out: String(primary.outputTokens ?? 'n/a')
    },
    usage: {
      sessionLeft: primary.remainingTokens != null ? `${primary.remainingTokens} tokens` : 'n/a',
      dayLeft: 'see OpenClaw session status'
    },
    tasks,
    subagents: subagentSessions,
    notes: [
      'State auto-synced from OpenClaw CLI runtime.',
      'Auto-refresh polls status every 15 seconds.',
      'Views: List, Kanban, Timeline.',
      'Dashboard is server-side protected on Vercel.'
    ]
  }
}

function writeIfChanged(path, obj) {
  const next = JSON.stringify(obj, null, 2) + '\n'
  const prev = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
  if (prev === next) return false
  fs.writeFileSync(path, next)
  return true
}

try {
  const state = build()
  const changedWork = writeIfChanged(STATUS_PATH_WORK, state)
  const changedRepo = writeIfChanged(STATUS_PATH_REPO, state)

  if (changedRepo) {
    run('git add status.json', DASH_REPO)
    try {
      run(`git commit -m "chore: sync live dashboard state"`, DASH_REPO)
      run('git push', DASH_REPO)
    } catch (e) {
      // no-op when nothing to commit or temporary remote issue
    }
  }

  if (changedWork) {
    try {
      run('git add operation-dashboard/status.json', WORKDIR)
      run('git commit -m "chore: sync operation dashboard live state"', WORKDIR)
      run('git push', WORKDIR)
    } catch {}
  }

  console.log('ok')
} catch (e) {
  console.error(String(e.message || e))
  process.exit(1)
}
