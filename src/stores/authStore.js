import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateSalt, deriveKey, encrypt, decrypt } from '../composables/useCrypto'
import { saveAuth, loadAuth, isFirstTime } from '../composables/useStorage'

let _encryptionKey = null

export const useAuthStore = defineStore('auth', () => {
  const isInitialized = ref(!isFirstTime())
  const isUnlocked = ref(false)

  function initFromStorage() {
    isInitialized.value = !isFirstTime()
  }

  async function setupMasterPassword(password) {
    const salt = generateSalt()
    const key = await deriveKey(password, salt)
    const keyCheck = await encrypt('NavVault-OK', key)
    saveAuth({
      salt: arrayBufferToBase64(salt),
      keyCheck,
    })
    _encryptionKey = key
    isInitialized.value = true
    isUnlocked.value = true
  }

  async function unlock(password) {
    const auth = loadAuth()
    if (!auth) return false

    const salt = base64ToArrayBuffer(auth.salt)
    const key = await deriveKey(password, salt)

    try {
      const result = await decrypt(auth.keyCheck.encrypted, auth.keyCheck.iv, key)
      if (result === 'NavVault-OK') {
        _encryptionKey = key
        isUnlocked.value = true
        return true
      }
    } catch {
      // decryption failed — wrong password
    }
    return false
  }

  function lock() {
    _encryptionKey = null
    isUnlocked.value = false
  }

  function getEncryptionKey() {
    if (!_encryptionKey) throw new Error('Session locked')
    return _encryptionKey
  }

  return {
    isInitialized,
    isUnlocked,
    initFromStorage,
    setupMasterPassword,
    unlock,
    lock,
    getEncryptionKey,
  }
})

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToArrayBuffer(str) {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
