<script setup>
import { ref } from 'vue'
const { startTour, stopTour, isOnboardingActive } = useOnboarding() 

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'DuoSigna'
const description = 'Learn sign language with DuoSigna, the interactive platform for mastering sign language through engaging lessons, real-time feedback, and a supportive community. Start your journey to fluency today!'

</script>

<template>
  <UApp>
    <UHeader :ui="{ container: 'max-w-full px-4 sm:px-6 lg:px-8' }">
      
      <template #left>
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            DuoSigna
          </NuxtLink>
        </div>
      </template>

      <template #panel>
        <div class="hidden"></div>
      </template>
      
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs" />

  </UApp>
</template>

<style>

header button.lg\:hidden {
  display: none !important;
}
</style>