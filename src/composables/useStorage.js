import seedGroups from '../data/mock.js'

const AUTH_KEY = 'navvault_auth'
const VAULT_KEY = 'navvault_vault'

function flattenSeedData() {
  const groups = []
  const sites = []
  for (const g of seedGroups) {
    groups.push({ id: g.id, name: g.name, order: g.order })
    for (let i = 0; i < g.sites.length; i++) {
      const s = g.sites[i]
      sites.push({
        id: s.id,
        groupId: g.id,
        title: s.title,
        url: s.url,
        order: i,
        credentials: null,
      })
    }
  }
  return { groups, sites }
}

export function saveAuth(authData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
}

export function loadAuth() {
  const raw = localStorage.getItem(AUTH_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveVault(vaultData) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vaultData))
}

export function loadVault() {
  const raw = localStorage.getItem(VAULT_KEY)
  if (raw) return JSON.parse(raw)

  const { groups, sites } = flattenSeedData()
  const seed = {
    version: 1,
    updatedAt: new Date().toISOString(),
    groups,
    sites,
  }
  saveVault(seed)
  return seed
}

export function isFirstTime() {
  return !localStorage.getItem(AUTH_KEY)
}

export function clearAll() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(VAULT_KEY)
}
