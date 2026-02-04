<template>
  <AccountForm/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AccountForm from './components/AccountForm.vue';

export default defineComponent({
  name:'App',
  components: { AccountForm },
  setup() {

  }
})
</script>

<style scoped>
</style>
