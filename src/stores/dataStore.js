import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore'
import { encrypt, decrypt } from '../composables/useCrypto'
import { loadVault, saveVault } from '../composables/useStorage'

export const useDataStore = defineStore('data', () => {
  const version = ref(1)
  const updatedAt = ref(null)
  const groups = ref([])
  const sites = ref([])
  const searchQuery = ref('')

  const filteredGroups = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    return groups.value
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((g) => {
        let groupSites = sites.value
          .filter((s) => s.groupId === g.id)
          .sort((a, b) => a.order - b.order)
        if (q) {
          groupSites = groupSites.filter(
            (s) =>
              s.title.toLowerCase().includes(q) ||
              s.url.toLowerCase().includes(q),
          )
        }
        return { ...g, sites: groupSites }
      })
      .filter((g) => !q || g.sites.length > 0)
  })

  function loadFromStorage() {
    const data = loadVault()
    version.value = data.version
    updatedAt.value = data.updatedAt
    groups.value = data.groups || []
    sites.value = data.sites || []
  }

  function persist() {
    updatedAt.value = new Date().toISOString()
    saveVault({
      version: version.value,
      updatedAt: updatedAt.value,
      groups: JSON.parse(JSON.stringify(groups.value)),
      sites: JSON.parse(JSON.stringify(sites.value)),
    })
  }

  // ---- Group CRUD ----

  function createGroup({ name }) {
    const id = crypto.randomUUID()
    const group = { id, name, order: groups.value.length }
    groups.value.push(group)
    persist()
    return group
  }

  function updateGroup(id, { name }) {
    const g = groups.value.find((g) => g.id === id)
    if (g) {
      g.name = name
      persist()
    }
  }

  function deleteGroup(id, migrateToId = null) {
    if (migrateToId) {
      const targetGroup = groups.value.find((g) => g.id === migrateToId)
      if (targetGroup) {
        const maxOrder = sites.value
          .filter((s) => s.groupId === migrateToId)
          .reduce((max, s) => Math.max(max, s.order), -1)
        sites.value.forEach((s) => {
          if (s.groupId === id) {
            s.groupId = migrateToId
            s.order = maxOrder + 1
          }
        })
      }
    } else {
      sites.value = sites.value.filter((s) => s.groupId !== id)
    }
    groups.value = groups.value.filter((g) => g.id !== id)
    persist()
  }

  function reorderGroups(groupIds) {
    groupIds.forEach((id, index) => {
      const g = groups.value.find((g) => g.id === id)
      if (g) g.order = index
    })
    persist()
  }

  // ---- Site CRUD ----

  async function createSite({ title, url, groupId, credentials }) {
    const id = crypto.randomUUID()
    const groupSites = sites.value.filter((s) => s.groupId === groupId)
    const site = {
      id,
      groupId,
      title,
      url,
      order: groupSites.length,
      credentials: null,
    }
    if (credentials && (credentials.username || credentials.password)) {
      site.credentials = await encryptCredentials(credentials)
    }
    sites.value.push(site)
    persist()
    return site
  }

  async function updateSite(id, { title, url, groupId, credentials }) {
    const s = sites.value.find((s) => s.id === id)
    if (!s) return
    if (title !== undefined) s.title = title
    if (url !== undefined) s.url = url
    if (groupId !== undefined) s.groupId = groupId
    if (credentials) {
      if (credentials.username !== undefined || credentials.password !== undefined) {
        s.credentials = await encryptCredentials(credentials)
      }
    }
    persist()
  }

  function deleteSite(id) {
    sites.value = sites.value.filter((s) => s.id !== id)
    persist()
  }

  function reorderSites(groupId, orderedIds) {
    const groupSites = sites.value.filter((s) => s.groupId === groupId)
    const others = sites.value.filter((s) => s.groupId !== groupId)
    orderedIds.forEach((id, index) => {
      const s = groupSites.find((s) => s.id === id)
      if (s) s.order = index
    })
    persist()
  }

  // ---- Credentials ----

  async function encryptCredentials({ username, password }) {
    const auth = useAuthStore()
    const key = auth.getEncryptionKey()
    const result = {}
    if (username) {
      const enc = await encrypt(username, key)
      result.username = { encrypted: enc.encrypted, iv: enc.iv }
    }
    if (password) {
      const enc = await encrypt(password, key)
      result.password = { encrypted: enc.encrypted, iv: enc.iv }
    }
    return result
  }

  async function decryptCredentials(siteId) {
    const s = sites.value.find((s) => s.id === siteId)
    if (!s || !s.credentials) return null

    const auth = useAuthStore()
    const key = auth.getEncryptionKey()
    const result = {}
    if (s.credentials.username) {
      result.username = await decrypt(
        s.credentials.username.encrypted,
        s.credentials.username.iv,
        key,
      )
    }
    if (s.credentials.password) {
      result.password = await decrypt(
        s.credentials.password.encrypted,
        s.credentials.password.iv,
        key,
      )
    }
    return result
  }

  async function saveCredentials(siteId, { username, password }) {
    const s = sites.value.find((s) => s.id === siteId)
    if (!s) return
    s.credentials = await encryptCredentials({ username, password })
    persist()
  }

  function clearCredentials(siteId) {
    const s = sites.value.find((s) => s.id === siteId)
    if (!s) return
    s.credentials = null
    persist()
  }

  function setSearchQuery(q) {
    searchQuery.value = q
  }

  function getExportData() {
    return {
      version: version.value,
      updatedAt: updatedAt.value,
      groups: JSON.parse(JSON.stringify(groups.value)),
      sites: JSON.parse(JSON.stringify(sites.value)),
    }
  }

  function importVaultData(data) {
    version.value = data.version || 1
    updatedAt.value = data.updatedAt || null
    groups.value = data.groups || []
    sites.value = data.sites || []
    persist()
  }

  return {
    version,
    updatedAt,
    groups,
    sites,
    searchQuery,
    filteredGroups,
    loadFromStorage,
    getExportData,
    importVaultData,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    createSite,
    updateSite,
    deleteSite,
    reorderSites,
    decryptCredentials,
    saveCredentials,
    clearCredentials,
    setSearchQuery,
  }
})
