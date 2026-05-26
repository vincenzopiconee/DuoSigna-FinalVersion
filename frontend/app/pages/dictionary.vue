<template>
  <div>
    <div class="flex min-h-[calc(100vh-140px)] bg-white dark:bg-transparent transition-colors duration-200">
      
      <AppSidebar />

      <div class="flex-1 px-4 lg:px-8 py-8 w-full max-w-7xl mx-auto">
        
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between mb-10 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg flex-shrink-0 flex items-center justify-center">
              <UIcon name="i-lucide-book-open" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sign Dictionary</h1>
                <UButton 
                  icon="i-lucide-info" 
                  color="primary" 
                  variant="ghost" 
                  size="xs" 
                  class="rounded-full hover:scale-110 transition-transform" 
                  @click="isInfoModalOpen = true" 
                />
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Explore the entire collection of available signs. Keep track of your progress and unlock new words.</p>
            </div>
          </div>
        </div>

        <div v-if="pending" class="flex flex-col items-center justify-center py-20 space-y-4">
          <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary-500 animate-spin" />
          <p class="text-gray-500 dark:text-gray-400 font-medium">Loading dictionary...</p>
        </div>

        <div v-else class="space-y-12">
          
          <section id="tour-dictionary-grid">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <UIcon name="i-lucide-case-upper" class="w-6 h-6 text-primary-500" />
              Alphabet
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <div v-for="letter in alphabetSigns" :key="letter.id" class="relative h-40">
                <div v-if="!letter.isUnlocked" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-2xl p-4 cursor-not-allowed select-none transition-colors">
                  <UIcon name="i-lucide-lock" class="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <span class="font-bold text-gray-500 dark:text-gray-400 tracking-wide uppercase text-sm text-center">{{ letter.label }}</span>
                </div>
                <div v-else @click="handleSignClick(letter)" class="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-2 border-primary-400 dark:border-primary-600 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                  <div class="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UIcon :name="getSpecificIcon(letter.id)" class="w-8 h-8" />
                  </div>
                  <span class="font-extrabold text-gray-800 dark:text-gray-100 tracking-wide uppercase text-sm text-center">{{ letter.label }}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <UIcon name="i-lucide-hand" class="w-6 h-6 text-primary-500" />
              Static Signs
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <div v-for="sign in staticSigns" :key="sign.id" class="relative h-40">
                <div v-if="!sign.isUnlocked" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-2xl p-4 cursor-not-allowed select-none transition-colors">
                  <UIcon name="i-lucide-lock" class="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <span class="font-bold text-gray-500 dark:text-gray-400 tracking-wide uppercase text-sm text-center">{{ sign.label }}</span>
                </div>
                <div v-else @click="handleSignClick(sign)" class="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-2 border-primary-400 dark:border-primary-600 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                  <div class="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UIcon :name="getSpecificIcon(sign.id)" class="w-8 h-8" />
                  </div>
                  <span class="font-extrabold text-gray-800 dark:text-gray-100 tracking-wide uppercase text-sm text-center">{{ sign.label }}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <UIcon name="i-lucide-move" class="w-6 h-6 text-primary-500" />
              Dynamic Signs
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <div v-for="sign in dynamicSigns" :key="sign.id" class="relative h-40">
                <div v-if="!sign.isUnlocked" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-2xl p-4 cursor-not-allowed select-none transition-colors">
                  <UIcon name="i-lucide-lock" class="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <span class="font-bold text-gray-500 dark:text-gray-400 tracking-wide uppercase text-sm text-center">{{ sign.label }}</span>
                </div>
                <div v-else @click="handleSignClick(sign)" class="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-2 border-primary-400 dark:border-primary-600 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                  <div class="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UIcon :name="getSpecificIcon(sign.id)" class="w-8 h-8" />
                  </div>
                  <span class="font-extrabold text-gray-800 dark:text-gray-100 tracking-wide uppercase text-sm text-center">{{ sign.label }}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  </div>

  <ClientOnly>
    <Teleport to="body">
      
      <transition name="modal-fade">
        <div v-if="isSignModalOpen && selectedSign" class="fixed inset-0 z-[990] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6" @click.self="isSignModalOpen = false">
          <UCard class="w-full max-w-md shadow-2xl relative overflow-visible" :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white capitalize">{{ selectedSign.label }}</h3>
                <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isSignModalOpen = false" />
              </div>
            </template>
            <div class="flex flex-col items-center py-6 px-4 text-center">
              <div class="w-24 h-24 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <UIcon :name="getSpecificIcon(selectedSign.id)" class="w-12 h-12" />
              </div>
              <h4 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">{{ selectedSign.label }}</h4>
              <div class="w-16 h-1 bg-primary-500 rounded-full mb-6"></div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 w-full">
                <p class="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  {{ selectedSign.instructions || "Instructions not available for this sign." }}
                </p>
                <div v-show="!imageLoadError" class="flex justify-center mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <img :src="`${backendUrl}/gif_output/${selectedSign.id}.gif`" :alt="`Sign for ${selectedSign.label}`" class="rounded-lg shadow-md max-w-full h-auto max-h-48 object-contain" @error="imageLoadError = true" />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </transition>

      <transition name="modal-fade">
        <div v-if="isInfoModalOpen" class="fixed inset-0 z-[995] flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-4 sm:p-6" @click.self="isInfoModalOpen = false">
          <UCard class="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden" :ui="{ divide: 'divide-y divide-gray-100 dark:divide-gray-800', body: 'p-6' }">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                  <UIcon name="i-lucide-info" class="w-6 h-6" />
                  <h3 class="text-xl font-black tracking-wide uppercase text-gray-900 dark:text-white">Dictionary Guide</h3>
                </div>
                <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isInfoModalOpen = false" />
              </div>
            </template>
            
            <div class="space-y-6 py-2">
              <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Welcome to the <b>DuoSigna Dictionary</b>! This is your personal library to track your learning journey in ASL.
              </p>

              <div class="space-y-5">
                <div class="flex gap-4 items-start">
                  <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                    <UIcon name="i-lucide-check-circle" class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-lg">Tracking Progress</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                      Signs with a <b>colorful border</b> are already unlocked. Click on them to review instructions and the reference GIF. Gray signs with a <b>lock icon</b> are still waiting to be learned!
                    </p>
                  </div>
                </div>

                <div class="flex gap-4 items-start">
                  <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                    <UIcon name="i-lucide-layers" class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-lg">Sign Categories</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                      Signs are organized into <b>Alphabet</b>, <b>Static Signs</b> (no movement), and <b>Dynamic Signs</b> (gestures involving motion), making it easy to find what you're looking for.
                    </p>
                  </div>
                </div>

                <div class="flex gap-4 items-start">
                  <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                    <UIcon name="i-lucide-zap" class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 dark:text-white text-lg">How to Unlock</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                      To unlock a word, head to the <b>AI Sign Tutor</b>. Ask the bot about a word, activate the camera, and perform the sign. If the AI detects <b>65% accuracy</b>, it will be added here!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end">
                <UButton color="primary" variant="solid" size="md" class="px-6 py-2.5 font-bold rounded-xl shadow-md" @click="isInfoModalOpen = false">
                  Got it!
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </transition>

    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { computed, ref } from 'vue'

const isSignModalOpen = ref(false)
const isInfoModalOpen = ref(false) // Stato per il pop-up informativo
const selectedSign = ref(null)

const imageLoadError = ref(false)

const backendUrl = 'http://localhost:8000' 
const { token } = useAuth()

// MAPPA DELLE ICONE SPECIFICHE
const signIcons = {
  'a': 'i-mdi-alpha-a', 'b': 'i-mdi-alpha-b', 'c': 'i-mdi-alpha-c', 'd': 'i-mdi-alpha-d', 'e': 'i-mdi-alpha-e',
  'bed': 'i-lucide-bed', 'boat': 'i-lucide-sailboat', 'book': 'i-lucide-book', 'callonphone': 'i-lucide-phone',
  'car': 'i-lucide-car', 'cheek': 'i-lucide-smile', 'down': 'i-lucide-arrow-down', 'ear': 'i-lucide-ear',
  'eye': 'i-lucide-eye', 'feet': 'i-lucide-footprints', 'finger': 'i-lucide-pointer', 'fireman': 'i-lucide-flame',
  'hair': 'i-lucide-scissors', 'hesheit': 'i-lucide-users', 'hungry': 'i-lucide-utensils', 'kiss': 'i-lucide-heart',
  'listen': 'i-lucide-headphones', 'look': 'i-lucide-search', 'man': 'i-lucide-user', 'minemy': 'i-lucide-hand',
  'nose': 'i-lucide-user', 'shhh': 'i-lucide-volume-x', 'stuck': 'i-lucide-lock', 'sun': 'i-lucide-sun',
  'table': 'i-lucide-table', 'there': 'i-lucide-map-pin', 'tongue': 'i-lucide-smile', 'up': 'i-lucide-arrow-up', 'wait': 'i-lucide-clock',
  'after': 'i-lucide-arrow-right', 'airplane': 'i-lucide-plane', 'all': 'i-lucide-layers', 'alligator': 'i-lucide-bug',
  'animal': 'i-lucide-paw-print', 'another': 'i-lucide-plus-circle', 'any': 'i-lucide-help-circle', 'apple': 'i-lucide-apple',
  'arm': 'i-lucide-hand', 'aunt': 'i-lucide-user', 'awake': 'i-lucide-sun', 'backyard': 'i-lucide-fence',
  'bad': 'i-lucide-thumbs-down', 'balloon': 'i-lucide-circle-dashed', 'bath': 'i-lucide-bath', 'because': 'i-lucide-help-circle',
  'bedroom': 'i-lucide-bed', 'bee': 'i-lucide-bug', 'before': 'i-lucide-arrow-left', 'beside': 'i-lucide-arrow-right-left',
  'better': 'i-lucide-thumbs-up', 'bird': 'i-lucide-bird', 'black': 'i-lucide-circle', 'blow': 'i-lucide-wind',
  'blue': 'i-lucide-droplet', 'boy': 'i-lucide-user', 'brother': 'i-lucide-user', 'brown': 'i-lucide-coffee',
  'bug': 'i-lucide-bug', 'bye': 'i-lucide-hand', 'can': 'i-lucide-check-circle', 'carrot': 'i-lucide-carrot',
  'cat': 'i-lucide-cat', 'cereal': 'i-lucide-wheat', 'chair': 'i-lucide-armchair', 'child': 'i-lucide-baby',
  'chin': 'i-lucide-user', 'chocolate': 'i-lucide-cookie', 'clean': 'i-lucide-sparkles', 'close': 'i-lucide-x',
  'closet': 'i-lucide-door-closed', 'cloud': 'i-lucide-cloud', 'clown': 'i-lucide-smile', 'cow': 'i-lucide-paw-print',
  'cowboy': 'i-lucide-hat', 'cry': 'i-lucide-frown', 'cut': 'i-lucide-scissors', 'cute': 'i-lucide-heart',
  'dad': 'i-lucide-user', 'dance': 'i-lucide-music', 'dirty': 'i-lucide-trash', 'dog': 'i-lucide-dog',
  'doll': 'i-lucide-user', 'donkey': 'i-lucide-paw-print', 'drawer': 'i-lucide-archive', 'drink': 'i-lucide-glass-water',
  'drop': 'i-lucide-droplet', 'dry': 'i-lucide-sun', 'dryer': 'i-lucide-wind', 'duck': 'i-lucide-bird',
  'elephant': 'i-lucide-paw-print', 'empty': 'i-lucide-circle', 'every': 'i-lucide-globe', 'face': 'i-lucide-smile',
  'fall': 'i-lucide-arrow-down-to-line', 'farm': 'i-lucide-tractor', 'fast': 'i-lucide-zap', 'find': 'i-lucide-search',
  'fine': 'i-lucide-thumbs-up', 'finish': 'i-lucide-check-check', 'first': 'i-lucide-medal', 'fish': 'i-lucide-fish',
  'flag': 'i-lucide-flag', 'flower': 'i-lucide-flower', 'food': 'i-lucide-utensils', 'for': 'i-lucide-arrow-right',
  'frenchfries': 'i-lucide-utensils', 'frog': 'i-lucide-bug', 'garbage': 'i-lucide-trash-2', 'gift': 'i-lucide-gift',
  'giraffe': 'i-lucide-paw-print', 'girl': 'i-lucide-user', 'give': 'i-lucide-gift', 'glasswindow': 'i-lucide-app-window',
  'go': 'i-lucide-play', 'goose': 'i-lucide-bird', 'grandma': 'i-lucide-user', 'grandpa': 'i-lucide-user',
  'grass': 'i-lucide-leaf', 'green': 'i-lucide-leaf', 'gum': 'i-lucide-smile', 'happy': 'i-lucide-smile',
  'hat': 'i-lucide-hard-hat', 'hate': 'i-lucide-frown', 'have': 'i-lucide-check', 'haveto': 'i-lucide-alert-circle',
  'head': 'i-lucide-user', 'hear': 'i-lucide-ear', 'helicopter': 'i-lucide-plane', 'hello': 'i-lucide-hand',
  'hen': 'i-lucide-bird', 'hide': 'i-lucide-eye-off', 'high': 'i-lucide-arrow-up', 'home': 'i-lucide-home',
  'horse': 'i-lucide-paw-print', 'hot': 'i-lucide-flame', 'icecream': 'i-lucide-ice-cream', 'if': 'i-lucide-help-circle',
  'into': 'i-lucide-log-in', 'jacket': 'i-lucide-shirt', 'jeans': 'i-lucide-shirt', 'jump': 'i-lucide-arrow-up-circle',
  'kitty': 'i-lucide-cat', 'lamp': 'i-lucide-lightbulb', 'later': 'i-lucide-clock', 'like': 'i-lucide-thumbs-up',
  'lion': 'i-lucide-paw-print', 'lips': 'i-lucide-smile', 'loud': 'i-lucide-volume-2', 'mad': 'i-lucide-angry',
  'make': 'i-lucide-hammer', 'many': 'i-lucide-layers', 'milk': 'i-lucide-glass-water', 'mitten': 'i-lucide-hand',
  'mom': 'i-lucide-user', 'moon': 'i-lucide-moon', 'morning': 'i-lucide-sunrise', 'mouse': 'i-lucide-mouse',
  'mouth': 'i-lucide-smile', 'music': 'i-lucide-music', 'nap': 'i-lucide-bed', 'napkin': 'i-lucide-square',
  'night': 'i-lucide-moon', 'no': 'i-lucide-x-circle', 'noisy': 'i-lucide-volume-2', 'not': 'i-lucide-ban',
  'now': 'i-lucide-clock', 'nuts': 'i-lucide-nut', 'old': 'i-lucide-hourglass', 'on': 'i-lucide-toggle-right',
  'open': 'i-lucide-door-open', 'orange': 'i-lucide-citrus', 'outside': 'i-lucide-tree-pine', 'owie': 'i-lucide-bandaid',
  'owl': 'i-lucide-bird', 'pajamas': 'i-lucide-moon', 'pen': 'i-lucide-pen', 'pencil': 'i-lucide-pencil',
  'penny': 'i-lucide-coins', 'person': 'i-lucide-user', 'pig': 'i-lucide-paw-print', 'pizza': 'i-lucide-pizza',
  'please': 'i-lucide-heart-handshake', 'police': 'i-lucide-badge', 'pool': 'i-lucide-waves', 'potty': 'i-lucide-bath',
  'pretend': 'i-lucide-theater', 'pretty': 'i-lucide-sparkles', 'puppy': 'i-lucide-dog', 'puzzle': 'i-lucide-puzzle',
  'quiet': 'i-lucide-volume-x', 'radio': 'i-lucide-radio', 'rain': 'i-lucide-cloud-rain', 'read': 'i-lucide-book-open',
  'red': 'i-lucide-circle', 'refrigerator': 'i-lucide-refrigerator', 'ride': 'i-lucide-car', 'room': 'i-lucide-box',
  'sad': 'i-lucide-frown', 'same': 'i-lucide-copy', 'say': 'i-lucide-message-circle', 'scissors': 'i-lucide-scissors',
  'see': 'i-lucide-eye', 'shirt': 'i-lucide-shirt', 'shoe': 'i-lucide-footprints', 'shower': 'i-lucide-shower',
  'sick': 'i-lucide-thermometer', 'sleep': 'i-lucide-moon', 'sleepy': 'i-lucide-bed', 'smile': 'i-lucide-smile',
  'snack': 'i-lucide-cookie', 'snow': 'i-lucide-snowflake', 'stairs': 'i-lucide-trending-up', 'stay': 'i-lucide-anchor',
  'sticky': 'i-lucide-magnet', 'store': 'i-lucide-store', 'story': 'i-lucide-book', 'talk': 'i-lucide-message-square',
  'taste': 'i-lucide-utensils', 'thankyou': 'i-lucide-heart-handshake', 'that': 'i-lucide-pointer', 'think': 'i-lucide-brain',
  'thirsty': 'i-lucide-glass-water', 'tiger': 'i-lucide-paw-print', 'time': 'i-lucide-clock', 'tomorrow': 'i-lucide-calendar-clock',
  'tooth': 'i-lucide-smile', 'toothbrush': 'i-lucide-brush', 'touch': 'i-lucide-hand', 'toy': 'i-lucide-gamepad-2',
  'tree': 'i-lucide-tree-deciduous', 'tv': 'i-lucide-tv', 'uncle': 'i-lucide-user', 'underwear': 'i-lucide-shirt',
  'vacuum': 'i-lucide-wind', 'wake': 'i-lucide-sun', 'water': 'i-lucide-droplet', 'wet': 'i-lucide-droplets',
  'weus': 'i-lucide-users', 'where': 'i-lucide-map-pin', 'white': 'i-lucide-circle', 'who': 'i-lucide-help-circle',
  'why': 'i-lucide-help-circle', 'will': 'i-lucide-calendar-days', 'wolf': 'i-lucide-paw-print', 'yellow': 'i-lucide-sun',
  'yes': 'i-lucide-check', 'yesterday': 'i-lucide-history', 'yourself': 'i-lucide-user', 'yucky': 'i-lucide-thumbs-down',
  'zebra': 'i-lucide-paw-print', 'zipper': 'i-lucide-activity'
}

const getSpecificIcon = (id) => {
  return signIcons[id] || 'i-lucide-star' 
}

const handleSignClick = (sign) => {
  imageLoadError.value = false
  selectedSign.value = sign
  let instructions = ""
  if (data.value?.letters && data.value.letters[sign.id]) {
    instructions = data.value.letters[sign.id]
  } else if (data.value?.words && data.value.words[sign.id]) {
    instructions = data.value.words[sign.id]
  }
  selectedSign.value.instructions = instructions
  isSignModalOpen.value = true
}

const staticKeys = [
  'bed', 'boat', 'book', 'callonphone', 'car', 'cheek', 'down', 'ear', 
  'eye', 'feet', 'finger', 'fireman', 'hair', 'hesheit', 'hungry', 'kiss', 
  'listen', 'look', 'man', 'minemy', 'nose', 'shhh', 'stuck', 'sun', 
  'table', 'there', 'tongue', 'up', 'wait'
]

const { data, pending } = await useAsyncData('dictionaryData', async () => {
  const headers = { Authorization: token.value || '' }
  const [lettersResponse, wordsResponse, unlockedResponse] = await Promise.all([
    $fetch(`${backendUrl}/api/dictionary/letters`),
    $fetch(`${backendUrl}/api/dictionary/words`),
    $fetch(`${backendUrl}/api/user/unlocked-signs`, { headers })
  ])
  return { letters: lettersResponse, words: wordsResponse, unlocked: unlockedResponse || [] }
})

const alphabetSigns = computed(() => {
  if (!data.value?.letters) return []
  return Object.keys(data.value.letters).map(key => ({
    id: key, label: key, isUnlocked: data.value.unlocked.includes(key.toLowerCase())
  })).sort((a, b) => a.isUnlocked === b.isUnlocked ? a.label.localeCompare(b.label) : (a.isUnlocked ? -1 : 1))
})

const staticSigns = computed(() => {
  if (!data.value?.words) return []
  return Object.keys(data.value.words).filter(key => staticKeys.includes(key)).map(key => ({ 
    id: key, label: key, isUnlocked: data.value.unlocked.includes(key.toLowerCase())
  })).sort((a, b) => a.isUnlocked === b.isUnlocked ? a.label.localeCompare(b.label) : (a.isUnlocked ? -1 : 1))
})

const dynamicSigns = computed(() => {
  if (!data.value?.words) return []
  return Object.keys(data.value.words).filter(key => !staticKeys.includes(key)).map(key => ({ 
    id: key, label: key, isUnlocked: data.value.unlocked.includes(key.toLowerCase())
  })).sort((a, b) => a.isUnlocked === b.isUnlocked ? a.label.localeCompare(b.label) : (a.isUnlocked ? -1 : 1))
})
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>