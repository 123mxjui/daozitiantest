const SYNC_KEY = 'navvault_sync'
const GIST_FILENAME = 'navvault-backup.json'

export function loadSyncConfig() {
  const raw = localStorage.getItem(SYNC_KEY)
  return raw ? JSON.parse(raw) : { token: '', gistId: '', syncedAt: null }
}

export function saveSyncConfig({ token, gistId, syncedAt }) {
  localStorage.setItem(SYNC_KEY, JSON.stringify({ token, gistId, syncedAt }))
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_KEY)
}

function parseError(status) {
  switch (status) {
    case 401: return 'Token 无效或已过期'
    case 404: return 'Gist 不存在，请检查 ID'
    case 403: return 'Token 缺少 gist 权限或触发限流'
    default: return `请求失败 (${status})`
  }
}

export async function createGist(token, content) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: '个人快捷入口数据备份',
      public: false,
      files: { [GIST_FILENAME]: { content } },
    }),
  })
  if (!res.ok) throw new Error(parseError(res.status))
  const data = await res.json()
  return data.id
}

export async function updateGist(token, gistId, content) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content } },
    }),
  })
  if (!res.ok) throw new Error(parseError(res.status))
}

export async function readGist(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(parseError(res.status))
  const data = await res.json()
  const file = data.files?.[GIST_FILENAME]
  if (!file) throw new Error('Gist 中未找到同步数据')
  return JSON.parse(file.content)
}
