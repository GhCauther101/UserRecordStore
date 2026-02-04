import { defineStore } from "pinia"
import { ref, watch } from "vue"

export type AccountType = "local" | "ldap"

export type TagItem = { text: string }

export type Account = {
  id: string
  tags: TagItem[]
  type: AccountType
  login: string
  password: string | null
}

const STORAGE_KEY = "accounts"

function uid() {
  return Math.random().toString(16).slice(2)
}

export const useAccountsStore = defineStore("accounts", () => {
  const accounts = ref<Account[]>([])

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      accounts.value = JSON.parse(raw)
    } catch {
      accounts.value = []
    }
  }

  function addEmpty() {
    accounts.value.push({
      id: uid(),
      tags: [],
      type: "local",
      login: "",
      password: "",
    })
  }

  function remove(id: string) {
    accounts.value = accounts.value.filter((a) => a.id !== id)
  }

  function update(updated: Account) {
    const idx = accounts.value.findIndex((a) => a.id === updated.id)
    if (idx === -1) accounts.value.push(updated)
    else accounts.value[idx] = updated
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value))
  }

  load()

  watch(
    accounts,
    () => {
      persist()
    },
    { deep: true }
  )

  return { accounts, addEmpty, remove, update }
})
