<script setup>
import { RouterLink, RouterView } from "vue-router";
import DefaultLayout from "./components/layouts/DefaultLayout.vue";

import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

function initializeLocalStorage() {
  const defaults = {
    selectedCity: null,
    district: null,
    selectedPolicyType: null,
    selectedAge: null,
    selectedJob: null,
    selectedName: null,
    page: 1,
  };

  Object.entries(defaults).forEach(([key, value]) => {
    const currentValue = localStorage.getItem(key);
    if (
      currentValue === null ||
      currentValue === "" ||
      currentValue === "null"
    ) {
      localStorage.setItem(key, value === null ? null : JSON.stringify(value));
    }
  });
}

onMounted(() => {
  initializeLocalStorage();
  authStore.initializeMemberFromToken();
});
</script>

<template>
  <DefaultLayout>
    <RouterView />
  </DefaultLayout>
</template>

<style scoped>
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
