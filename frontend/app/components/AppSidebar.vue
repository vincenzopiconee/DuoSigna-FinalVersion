<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// --- LOGICA DI AUTENTICAZIONE ---
// Estraiamo anche "token" per poter fare chiamate sicure al backend!
const { data: authUser, signOut, token } = useAuth()

const userName = computed(() => authUser.value?.nome || 'Ospite')
const userEmail = computed(() => authUser.value?.email || '')

// --- GESTIONE DELL'AVATAR ---
const currentAvatar = ref('https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=b6e3f4')

watchEffect(() => {
  if (authUser.value?.avatar_url) {
    currentAvatar.value = authUser.value.avatar_url
  }
})

const handleLogout = async () => {
  isProfileModalOpen.value = false 
  await signOut({ redirect: false }) 
  window.location.href = '/'
}

// ==============================================
// 1. STATO DELLA SIDEBAR
// ==============================================
const isSidebarOpen = ref(true)
const isColorMenuOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  if (!isSidebarOpen.value) {
    isColorMenuOpen.value = false
  }
}

const toggleColorMenu = () => {
  if (!isSidebarOpen.value) {
    isSidebarOpen.value = true
  }
  isColorMenuOpen.value = !isColorMenuOpen.value
}

const isActive = (path) => route.path.startsWith(path)
const getBtnColor = (path) => isActive(path) ? 'primary' : 'gray'
const getBtnVariant = (path) => isActive(path) ? 'soft' : 'ghost'
const getBtnHoverClass = (path) => isActive(path) 
  ? '' 
  : 'hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400'

// ==============================================
// 2. STATO DEI MODALI E DATI
// ==============================================
const isProfileModalOpen = ref(false)
const isSettingsModalOpen = ref(false)
const isAvatarModalOpen = ref(false)

// Aggiornato per corrispondere ESATTAMENTE a index.vue
const presetAvatars = [
  'https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/micah/svg?seed=Aneka&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/micah/svg?seed=Milo&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/micah/svg?seed=Jude&backgroundColor=ffb5d2',
  'https://api.dicebear.com/9.x/micah/svg?seed=Leo&backgroundColor=fef08a',
  'https://api.dicebear.com/9.x/micah/svg?seed=Oliver&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/micah/svg?seed=Luna&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/micah/svg?seed=Kiki&backgroundColor=c0aede'
]

// Ora la funzione contatta il backend e salva la scelta nel database!
const selectAvatar = async (url) => {
  // 1. Aggiornamento istantaneo visivo per l'utente
  currentAvatar.value = url
  isAvatarModalOpen.value = false
  
  // 2. Salvataggio permanente nel database
  try {
    await $fetch('http://127.0.0.1:8000/update-avatar', {
      method: 'PUT',
      headers: { 'Authorization': token.value },
      body: { avatar_url: url }
    })
    
    // Aggiorniamo anche l'oggetto della sessione in memoria per consistenza
    if (authUser.value) {
      authUser.value.avatar_url = url
    }
  } catch (error) {
    console.error("Errore durante il salvataggio dell'avatar:", error)
  }
}

// ==============================================
// 3. IMPOSTAZIONI E TEMA COLORI
// ==============================================
const settings = ref({
  soundEffects: true,
  animations: true,
  motivationalMessages: true,
  listeningExercises: true,
  theme: 'system'
})

const themeOptions = [
  { label: 'SYSTEM SETTINGS', value: 'system' },
  { label: 'LIGHT', value: 'light' },
  { label: 'DARK', value: 'dark' }
]

const appConfig = useAppConfig()
const themeColors = [
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'green', hex: '#22c55e' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'indigo', hex: '#6366f1' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'rose', hex: '#f43f5e' }
]

if (!appConfig.ui) appConfig.ui = {}
if (!appConfig.ui.colors) appConfig.ui.colors = { primary: 'green' }

const changeThemeColor = (colorName) => {
  appConfig.ui.colors.primary = colorName
  if (import.meta.client) {
    localStorage.setItem('duosigna-theme', colorName)
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('duosigna-theme')
  if (savedTheme) {
    appConfig.ui.colors.primary = savedTheme
  }
})
</script>

<template>
  <div 
    class="flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden"
    :class="isSidebarOpen ? 'w-72 px-6 py-6' : 'w-20 px-2 py-6 items-center'"
  >
    <div class="flex flex-col w-full h-full">
      
      <UButton 
        :icon="isSidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" 
        color="gray" 
        variant="ghost" 
        class="self-end mb-4 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        :class="!isSidebarOpen ? 'self-center' : ''"
        @click="toggleSidebar" 
        aria-label="Toggle Sidebar"
      />

      <div class="flex flex-col items-center gap-4 mt-2">
        <UAvatar 
          :src="currentAvatar"
          alt="Profile Picture"
          :ui="{ rounded: 'rounded-full' }"
          class="shadow-lg border-4 border-white dark:border-gray-800 ring-2 ring-primary-500 dark:ring-primary-400 transition-all duration-300"
          :class="isSidebarOpen ? 'w-32 h-32' : 'w-12 h-12'"
        />
        <span v-if="isSidebarOpen" class="font-extrabold text-2xl text-gray-900 dark:text-white mt-2 tracking-tight">{{ userName }}</span>
      </div>

      <div class="flex flex-col gap-2 w-full mt-10">

        <UButton 
          icon="i-lucide-home" 
          :label="isSidebarOpen ? 'Homepage' : ''" 
          :color="getBtnColor('/homepage')" 
          :variant="getBtnVariant('/homepage')" 
          size="lg"
          class="text-base py-3 transition-all duration-200"
          :class="[isSidebarOpen ? 'justify-start px-4' : 'justify-center', getBtnHoverClass('/homepage')]" 
          to="/homepage"
        />
        
        <UButton 
          id="tour-sidebar-chatbot"
          icon="i-lucide-message-circle" 
          :label="isSidebarOpen ? 'ChatBot' : ''" 
          :color="getBtnColor('/chatbot')" 
          :variant="getBtnVariant('/chatbot')" 
          size="lg"
          class="text-base py-3 transition-all duration-200"
          :class="[isSidebarOpen ? 'justify-start px-4' : 'justify-center', getBtnHoverClass('/chatbot')]" 
          to="/chatbot"
        />

        <UButton 
          id="tour-sidebar-dictionary"
          icon="i-lucide-book-open" 
          :label="isSidebarOpen ? 'Dictionary' : ''" 
          :color="getBtnColor('/dictionary')" 
          :variant="getBtnVariant('/dictionary')" 
          size="lg"
          class="text-base py-3 transition-all duration-200"
          :class="[isSidebarOpen ? 'justify-start px-4' : 'justify-center', getBtnHoverClass('/dictionary')]" 
          to="/dictionary"
        />

        <UButton 
          id="tour-sidebar-quiz"
          icon="i-lucide-gamepad-2" 
          :label="isSidebarOpen ? 'Quiz' : ''" 
          :color="getBtnColor('/quiz')" 
          :variant="getBtnVariant('/quiz')" 
          size="lg"
          class="text-base py-3 transition-all duration-200"
          :class="[isSidebarOpen ? 'justify-start px-4' : 'justify-center', getBtnHoverClass('/quiz')]" 
          to="/quiz"
        />

        <div class="flex flex-col w-full">
          <UButton 
            icon="i-lucide-palette" 
            :label="isSidebarOpen ? 'Color' : ''" 
            color="gray" 
            variant="ghost" 
            size="lg"
            class="text-base py-3 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
            :class="isSidebarOpen ? 'justify-start px-4' : 'justify-center'" 
            @click="toggleColorMenu"
          />
          
          <transition name="expand">
            <div 
              v-if="isColorMenuOpen && isSidebarOpen" 
              class="ml-8 my-2 pl-4 border-l-2 border-primary-200 dark:border-primary-800"
            >
              <div class="grid grid-cols-4 gap-3 py-2">
                <button
                  v-for="color in themeColors"
                  :key="color.name"
                  class="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none shadow-sm"
                  :style="{ backgroundColor: color.hex }"
                  :class="appConfig.ui.colors.primary === color.name ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-900 scale-125' : ''"
                  @click="changeThemeColor(color.name)"
                  :title="color.name"
                >
                </button>
              </div>
            </div>
          </transition>
        </div>

        <UButton 
          icon="i-lucide-user" 
          :label="isSidebarOpen ? 'Profile' : ''" 
          color="gray" 
          variant="ghost" 
          size="lg"
          class="text-base py-3 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
          :class="isSidebarOpen ? 'justify-start px-4' : 'justify-center'" 
          @click="isProfileModalOpen = true"
        />
        
        <UButton 
          icon="i-lucide-settings" 
          :label="isSidebarOpen ? 'Settings' : ''" 
          color="gray" 
          variant="ghost" 
          size="lg"
          class="text-base py-3 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
          :class="isSidebarOpen ? 'justify-start px-4' : 'justify-center'" 
          @click="isSettingsModalOpen = true"
        />

        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 w-full">
          <UButton 
            icon="i-lucide-log-out" 
            :label="isSidebarOpen ? 'Logout' : ''" 
            color="red" 
            variant="ghost" 
            size="lg"
            class="w-full text-base py-3 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200" 
            :class="isSidebarOpen ? 'justify-start px-4' : 'justify-center'" 
            @click="handleLogout" 
          />
        </div>
      </div>
    </div>
  </div>

  <ClientOnly>
    <Teleport to="body">
      
      <transition name="modal-fade">
        <div v-if="isProfileModalOpen" class="fixed inset-0 z-[990] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6" @click.self="isProfileModalOpen = false">
          <UCard class="w-full max-w-sm shadow-2xl relative" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Profile</h3>
                <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isProfileModalOpen = false" />
              </div>
            </template>
            <div class="flex flex-col items-center py-2">
              <div class="relative group cursor-pointer mb-6" @click="isAvatarModalOpen = true" title="Change Avatar">
                <UAvatar :src="currentAvatar" size="3xl" class="w-32 h-32 border-4 border-gray-100 dark:border-gray-800 shadow-md group-hover:border-primary-500 transition-colors" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIcon name="i-lucide-camera" class="w-8 h-8 text-white" />
                </div>
              </div>
              <div class="w-full flex flex-col items-center gap-5 mb-8 mt-2">
                <UInput 
                  :model-value="userName" 
                  disabled 
                  icon="i-lucide-user" 
                  size="lg" 
                  class="w-full max-w-xs"
                  input-class="text-center font-bold text-gray-700 dark:text-gray-200" 
                />
                <UInput 
                  :model-value="userEmail" 
                  disabled 
                  icon="i-lucide-mail" 
                  size="lg" 
                  class="w-full max-w-xs"
                  input-class="text-center font-bold text-gray-700 dark:text-gray-200" 
                />
              </div>
              <div class="w-full flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-6 px-4">
                <UButton color="primary" variant="soft" block icon="i-lucide-key" size="lg">Change Password</UButton>
                
                <UButton 
                  color="gray" 
                  variant="ghost" 
                  block 
                  icon="i-lucide-log-out" 
                  size="lg" 
                  class="text-gray-600 dark:text-gray-300"
                  @click="handleLogout" 
                >
                  Logout
                </UButton>
                
                <UButton color="red" variant="ghost" block icon="i-lucide-trash-2" size="lg" class="mt-1 text-red-500">Delete Account</UButton>
              </div>
            </div>
          </UCard>
        </div>
      </transition>

      <transition name="modal-fade">
        <div v-if="isSettingsModalOpen" class="fixed inset-0 z-[990] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6" @click.self="isSettingsModalOpen = false">
          <UCard class="w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h3>
                <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isSettingsModalOpen = false" />
              </div>
            </template>
            <div class="py-2">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-2 space-y-8">
                  <div class="space-y-4">
                    <h4 class="text-lg font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-2">Lesson Settings</h4>
                    <div class="flex flex-col gap-5 pt-2">
                      <div class="flex items-center justify-between"><span class="font-bold text-gray-700 dark:text-gray-200">Sound Effects</span><UToggle size="lg" v-model="settings.soundEffects" /></div>
                      <div class="flex items-center justify-between"><span class="font-bold text-gray-700 dark:text-gray-200">Animations</span><UToggle size="lg" v-model="settings.animations" /></div>
                      <div class="flex items-center justify-between"><span class="font-bold text-gray-700 dark:text-gray-200">Motivational Messages</span><UToggle size="lg" v-model="settings.motivationalMessages" /></div>
                      <div class="flex items-center justify-between"><span class="font-bold text-gray-700 dark:text-gray-200">Listening Exercises</span><UToggle size="lg" v-model="settings.listeningExercises" /></div>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <h4 class="text-lg font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-2">Appearance</h4>
                    <div class="pt-2 flex flex-col gap-2">
                      <span class="font-bold text-gray-700 dark:text-gray-200">Night Mode</span>
                      <USelect v-model="settings.theme" :options="themeOptions" size="lg" class="w-full font-semibold text-gray-600" />
                    </div>
                  </div>
                </div>
                <div class="md:col-span-1 flex flex-col gap-6">
                  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <h5 class="text-gray-500 dark:text-gray-400 font-bold mb-4 text-lg">Account</h5>
                    <ul class="space-y-4 font-bold text-gray-700 dark:text-gray-200">
                      <li class="cursor-pointer hover:text-primary-500 transition-colors">Preferences</li>
                      <li class="cursor-pointer hover:text-primary-500 transition-colors">Privacy Settings</li>
                    </ul>
                  </div>
                  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <h5 class="text-gray-500 dark:text-gray-400 font-bold mb-4 text-lg">Support</h5>
                    <ul class="space-y-4 font-bold text-gray-700 dark:text-gray-200">
                      <li class="cursor-pointer hover:text-primary-500 transition-colors">Support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </transition>

      <transition name="modal-fade">
        <div v-if="isAvatarModalOpen" class="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6" @click.self="isAvatarModalOpen = false">
          <UCard class="w-full max-w-md shadow-2xl relative" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Choose your Avatar</h3>
                <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isAvatarModalOpen = false" />
              </div>
            </template>
            <div class="flex flex-wrap justify-center gap-6 py-6">
              <div v-for="(avatarUrl, index) in presetAvatars" :key="index" class="relative group cursor-pointer" @click="selectAvatar(avatarUrl)">
                <UAvatar :src="avatarUrl" size="3xl" class="w-20 h-20 transition-transform duration-200 group-hover:scale-110 border-4" :class="currentAvatar === avatarUrl ? 'border-primary-500 shadow-lg scale-110' : 'border-transparent hover:border-primary-300'" :ui="{ rounded: 'rounded-full' }" />
                <div v-if="currentAvatar === avatarUrl" class="absolute -top-2 -right-2 bg-primary-500 text-white rounded-full p-1 shadow-md">
                  <UIcon name="i-lucide-check" class="w-4 h-4" />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </transition>

    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  max-height: 200px;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>