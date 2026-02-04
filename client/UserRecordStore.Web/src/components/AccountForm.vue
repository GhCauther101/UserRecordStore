<template>
  <section class="card">
    <!-- Header -->
    <header class="header">
      <h2 class="title">Учетные записи</h2>

      <button class="icon-btn" type="button" @click="onAdd" aria-label="Добавить">
        <span class="plus">+</span>
      </button>
    </header>

    <!-- Hint -->
    <div class="hint" role="note">
      <span class="hint-icon" aria-hidden="true">?</span>
      <span class="hint-text">
        Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
      </span>
    </div>

    <!-- Grid "table" -->
    <div class="grid">
      <!-- Head -->
      <div class="thead">
        <div class="tr">
            <div class="th">Метки</div>
            <div class="th">Тип записи</div>
            <div class="th">Логин</div>
            <div class="th">Пароль</div>
        </div>
      </div>

      <!-- Rows -->
      <div class="tbody">
        <div class="tr" v-for="row in uiRows" :key="row.id">
          <div class="td">
            <input
                v-model="row.tagsInput"
                class="input"
                type="text"
                placeholder="Значение"
                @blur="validateAndSave(row.id)"
            />
          </div>

          <div class="td">
            <select v-model="row.type" 
                    class="select" 
                    @change="onTypeChange(row.id)">
                <option value="local">Локальная</option>
                <option value="ldap">LDAP</option>
            </select>
          </div>

          <div class="td">
          <input
              v-model="row.login"
              :class="{ invalid: row.errors.login }"
              class="input"
              type="text"
              maxlength="100"
              @blur="validateAndSave(row.id)"
              placeholder="Значение"
          />
          </div>

          <div v-if="row.type.match('local')" class="td password-cell">
          <input
              v-model="row.password"
              class="input input-password"
              :type="row.showPassword ? 'text' : 'password'"
              :class="{ invalid: row.errors.password }"
              maxlength="100"
              @blur="validateAndSave(row.id)"
              placeholder="••••••••"
          />
          <button
              class="icon-btn eye"
              type="button"
              @click="row.showPassword = !row.showPassword"
              :aria-label="row.showPassword ? 'Скрыть пароль' : 'Показать пароль'"
          >
              <!-- eye / eye-off -->
              <svg v-if="!row.showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42" stroke="currentColor" stroke-width="2"/>
              <path
                  d="M2 12s3.5-7 10-7c2.1 0 3.9.7 5.4 1.7M22 12s-3.5 7-10 7c-2.1 0-3.9-.7-5.4-1.7"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round"
              />
              </svg>
          </button>
          </div>

          <div class="td actions">
              <button class="icon-btn trash" type="button" @click="store.remove(row.id)" aria-label="Удалить">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M8 6V4h8v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M6 6l1 16h10l1-16" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
              </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { computed, reactive, watch } from "vue"
import { useAccountsStore, type Account, type TagItem, type AccountType } from "../stores/accounts"

type UiRow = {
  id: string
  tagsInput: string
  type: AccountType
  login: string
  password: string
  showPassword: boolean
  errors: {
    tags: boolean
    login: boolean
    password: boolean
  }
}

const store = useAccountsStore()

// UI rows derived from store (with local UI state like showPassword + errors)
const uiRows = reactive<UiRow[]>(
  store.accounts.map((a) => ({
    id: a.id,
    tagsInput: a.tags.map((t) => t.text).join("; "),
    type: a.type,
    login: a.login,
    password: a.password ?? "",
    showPassword: false,
    errors: { tags: false, login: false, password: false },
  }))
)

// keep UI in sync when refresh / load
const syncFromStore = computed(() => store.accounts)

watch(
  syncFromStore,
  (accounts: Account[]) => {
    // naive sync (ok for test assignment)
    uiRows.splice(0, uiRows.length, ...accounts.map((a) => ({
      id: a.id,
      tagsInput: a.tags.map((t) => t.text).join("; "),
      type: a.type,
      login: a.login,
      password: a.password ?? "",
      showPassword: false,
      errors: { tags: false, login: false, password: false },
    })))
  },
  { deep: true, immediate: true }
)

function onAdd() {
  store.addEmpty()
}

function parseTags(tagsInput: string): TagItem[] {
  if (!tagsInput.trim()) return []
  return tagsInput
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

function validate(row: UiRow) {
  // tags optional but max 50 chars (input has maxlength, but still validate)
  row.errors.tags = row.tagsInput.length > 50

  row.errors.login = row.login.trim().length === 0 || row.login.length > 100

  row.errors.password =
    row.type === "local"
      ? row.password.trim().length === 0 || row.password.length > 100
      : false

  return !(row.errors.tags || row.errors.login || row.errors.password)
}

function validateAndSave(id: string) {
  const row = uiRows.find((r) => r.id === id)
  if (!row) return

  const ok = validate(row)
  if (!ok) return

  const payload: Account = {
    id: row.id,
    tags: parseTags(row.tagsInput),
    type: row.type,
    login: row.login.trim(),
    password: row.type === "ldap" ? null : row.password,
  }

  store.update(payload)
}

function onTypeChange(id: string) {
  const row = uiRows.find((r) => r.id === id)
  if (!row) return

  // if LDAP -> hide password and save as null
  if (row.type === "ldap") {
    row.password = ""
  }

  validateAndSave(id)
}

// type AccountRow = {
//   id: string
//   tags: string
//   type: 'local' | 'ldap'
//   login: string
//   password: string
//   showPassword: boolean
// }

// const uid = () => Math.random().toString(16).slice(2)

// const rows = ref<AccountRow[]>([
//   { id: uid(), tags: 'XXX', type: 'local', login: 'Значение', password: 'password', showPassword: false },
//   { id: uid(), tags: 'XXX; YYYYYYYYYY; MMMMM, MMMMMMMMMM', type: 'local', login: 'Значение', password: 'password', showPassword: false },
//   { id: uid(), tags: 'XXX', type: 'local', login: 'Значение', password: 'password', showPassword: false },
//   { id: uid(), tags: 'Значение', type: 'ldap', login: 'Значение', password: '', showPassword: false },
//   { id: uid(), tags: 'Значение', type: 'ldap', login: 'Значение', password: '', showPassword: false },
// ])

// function addRow() {
//   rows.value.push({
//     id: uid(),
//     tags: '',
//     type: 'local',
//     login: '',
//     password: '',
//     showPassword: false,
//   })
// }

// function removeRow(index: number) {
//   rows.value.splice(index, 1)
// }
</script>

<style scoped>
.card {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px 14px;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #d6dbe2;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  color: #586274;
}

.icon-btn:hover {
  background: #f6f8fb;
}

.plus {
  font-size: 20px;
  line-height: 1;
  transform: translateY(-1px);
}

.hint {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f6f8fb;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  padding: 10px 12px;
  color: #566074;
  font-size: 13px;
  margin-bottom: 12px;
}

.hint-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #cfd6df;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #6b768a;
  flex: 0 0 auto;
}

.grid {
  width: 70%;
  align-self: baseline;
  display: flex;
  flex-direction: column;
  width: 70%;
  grid-template-columns: auto auto auto auto;
  gap: 10px 10px;
  align-items: center;
  align-content: center;
  align-self: first baseline;
}

.th {
  align-self: center;
  font-size: 12px;
  color: #8b95a7;
  padding-left: 2px;
}

.thead {
  width: 70%;
  align-self: baseline;
}

.thead .th{
  width: 100%;
}

.tbody {
  width: 70%;
  align-self: baseline;
}

.tbody .th{
  display: flex;
  flex-direction: row;
  width: 100%;
}

.tr {
    display: flex;
    flex-direction: row;
}

.td {
  margin: 5px 5px;
  position: relative;
}

input,
select {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid #d6dbe2;
  padding: 0 10px;
  font-size: 13px;
  color: #1f2a3a;
  outline: none;
  background: #fff;
}

select {
  padding-right: 28px;
}

input:focus,
select:focus {
  border-color: #9db7ff;
  box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.15);
}

.password-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-password {
  flex: 1 1 auto;
}

.eye {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.trash {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}
</style>