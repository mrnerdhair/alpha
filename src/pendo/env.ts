import { expectedResponseKeys } from './filters'
import { makeStorageWrapper, PendoStorage, PendoStorageWrapper } from './storage'
import type { Pendo, PendoConfig } from './types'

const MAX_LOG_LENGTH = 1024

export type PendoEnv = {
  PendoConfig: PendoConfig
  pendo: Pendo
  expectedResponseKeys: string[]
  compressMap: Map<string, object>
  transmissionLog: Record<string, unknown>[]
  cookieStorage: PendoStorage
  cookieStorageWrapper: PendoStorageWrapper
  localStorage: PendoStorage
  localStorageWrapper: PendoStorageWrapper
  sessionStorage: PendoStorage
  sessionStorageWrapper: PendoStorageWrapper
  get sealed(): boolean
  unseal(): void
}

export function createTransmissionLog(): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const push = out.push.bind(out)
  out.push = (x) => {
    push(x)
    while (out.length > MAX_LOG_LENGTH) out.shift()
    return out.length
  }

  return out
}

export function makePendoEnv(pendoConfig: PendoConfig): PendoEnv {
  // This is the standard agent stub usually set up by the snippet.
  const pendo: Pendo = {
    _q: [] as unknown[],
    initialize(...args: unknown[]) {
      pendo._q.unshift(['initialize', ...args])
    },
    identify(...args: unknown[]) {
      pendo._q.push(['identify', ...args])
    },
    updateOptions(...args: unknown[]) {
      pendo._q.push(['updateOptions', ...args])
    },
    pageLoad(...args: unknown[]) {
      pendo._q.push(['pageLoad', ...args])
    },
    track(...args: unknown[]) {
      pendo._q.push(['track', ...args])
    }
  }

  const compressMap = new Map<string, object>()
  const [cookieStorage, cookieStorageWrapper] = makeStorageWrapper()
  const [localStorage, localStorageWrapper] = makeStorageWrapper({
    'log-enabled': true
  })
  const [sessionStorage, sessionStorageWrapper] = makeStorageWrapper()
  const transmissionLog = createTransmissionLog()

  let unsealed = false

  return Object.freeze({
    PendoConfig: pendoConfig,
    pendo,
    expectedResponseKeys,
    compressMap,
    transmissionLog,
    cookieStorageWrapper,
    localStorageWrapper,
    sessionStorageWrapper,
    cookieStorage,
    localStorage,
    sessionStorage,
    get sealed() {
      return !unsealed
    },
    unseal() {
      const warning = `PendoEnv: Agent environment unsealed. Many security protections are now disabled. Reload the page if you didn't expect this message.`
      console.warn(warning)
      alert(warning)
      unsealed = true
    }
  })
}