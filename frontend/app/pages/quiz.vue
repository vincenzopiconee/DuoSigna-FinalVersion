<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { useAuth } from '#imports'

const { token } = useAuth()

// ==============================================
// STATO GENERALE DEL QUIZ
// ==============================================
const quizState = ref('intro') 
const currentQuestionIndex = ref(0)
const score = ref(0)
const attemptsLeft = ref(3)
const feedbackMessage = ref('')
const feedbackType = ref('') 
const errorMessage = ref('') 
const isInfoModalOpen = ref(false)
const selectedDifficulty = ref('')
const questions = ref([])
const feedbackHints = ref([])

const difficultyLevels = ref([
  { id: 'alphabet', title: 'Alphabet', description: 'Test yourself with the ASL alphabet letters.', icon: 'i-lucide-case-sensitive' },
  { id: 'static', title: 'Static Signs', description: 'Practice with signs that do not require movement.', icon: 'i-lucide-hand' },
  { id: 'dynamic', title: 'Dynamic Signs', description: 'Challenge yourself with signs that involve movement.', icon: 'i-lucide-move' },
  { id: 'mixed', title: 'Mixed', description: 'The final test combining all types of signs.', icon: 'i-lucide-shuffle' }
])

const selectCategory = (id) => { 
  selectedDifficulty.value = id 
  errorMessage.value = '' // Pulisce istantaneamente l'errore quando si cambia scheda
}
const currentQuestion = computed(() => questions.value.length > 0 ? questions.value[currentQuestionIndex.value] : null)

// ==============================================
// LOGICA WEBCAM & MEDIAPIPE (REPLICATA DA CHATBOT)
// ==============================================
const isCameraActive = ref(false)
const isPredicting = ref(false)
const showLandmarks = ref(true)
const showHint = ref(false)
const appState = ref('IDLE')

const videoElement = ref(null)
const canvasElement = ref(null)
const canvasCtx = ref(null)

const signFrames = ref([])
const MIN_FRAMES = 15

// Allineamento del campionamento frame per non distorcere l'inferenza temporale di TF
const maxFrames = computed(() => currentQuestion.value?.level === 'level_1' ? 150 : 384)

let holistic = null
let camera = null
let drawingUtils = null
let mpHolistic = null

const onResults = (results) => {
  if (canvasCtx.value && canvasElement.value && drawingUtils && mpHolistic) {
    canvasCtx.value.save()
    canvasCtx.value.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
    if (showLandmarks.value) {
      if (results.faceLandmarks) drawingUtils.drawLandmarks(canvasCtx.value, results.faceLandmarks, { color: '#648214', lineWidth: 1, radius: 1 })
      if (results.poseLandmarks) {
        drawingUtils.drawConnectors(canvasCtx.value, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, { color: '#1E50C8', lineWidth: 2 })
        drawingUtils.drawLandmarks(canvasCtx.value, results.poseLandmarks, { color: '#1E50C8', lineWidth: 2, radius: 3 })
      }
      if (results.leftHandLandmarks) {
        drawingUtils.drawConnectors(canvasCtx.value, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: '#C81E64', lineWidth: 2 })
        drawingUtils.drawLandmarks(canvasCtx.value, results.leftHandLandmarks, { color: '#C81E64', lineWidth: 2, radius: 3 })
      }
      if (results.rightHandLandmarks) {
        drawingUtils.drawConnectors(canvasCtx.value, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: '#C81E64', lineWidth: 2 })
        drawingUtils.drawLandmarks(canvasCtx.value, results.rightHandLandmarks, { color: '#C81E64', lineWidth: 2, radius: 3 })
      }
    }
    canvasCtx.value.restore()
  }

  if (appState.value === 'BUFFERING') {
    if (signFrames.value.length < maxFrames.value) {
      const frameData = Array(543).fill([null, null, null])
      if (results.faceLandmarks) results.faceLandmarks.forEach((lm, i) => frameData[i] = [lm.x, lm.y, lm.z])
      if (results.leftHandLandmarks) results.leftHandLandmarks.forEach((lm, i) => frameData[468 + i] = [lm.x, lm.y, lm.z])
      if (results.poseLandmarks) results.poseLandmarks.forEach((lm, i) => frameData[489 + i] = [lm.x, lm.y, lm.z])
      if (results.rightHandLandmarks) results.rightHandLandmarks.forEach((lm, i) => frameData[522 + i] = [lm.x, lm.y, lm.z])
      signFrames.value.push(frameData)
    }
    if (signFrames.value.length === maxFrames.value && !isPredicting.value) {
      submitSign()
    }
  }
}

const activateCamera = async () => {
  if (document.activeElement?.blur) document.activeElement.blur()
  isCameraActive.value = true
  appState.value = 'IDLE'
  signFrames.value = []
  
  await nextTick()
  if (canvasElement.value) canvasCtx.value = canvasElement.value.getContext('2d')

  if (import.meta.client && videoElement.value) {
    try {
      mpHolistic = await import('@mediapipe/holistic')
      const { Camera } = await import('@mediapipe/camera_utils')
      drawingUtils = await import('@mediapipe/drawing_utils')

      holistic = new mpHolistic.Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      })
      holistic.setOptions({
        modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
      })
      holistic.onResults(onResults)

      camera = new Camera(videoElement.value, {
        onFrame: async () => {
          if (isCameraActive.value && videoElement.value) {
            if (canvasElement.value && canvasElement.value.width !== videoElement.value.videoWidth) {
              canvasElement.value.width = videoElement.value.videoWidth
              canvasElement.value.height = videoElement.value.videoHeight
            }
            await holistic.send({ image: videoElement.value })
          }
        },
        width: 1280, height: 720
      })
      camera.start()
      window.addEventListener('keydown', handleKeyboard)
    } catch (err) {
      console.error("Errore inizializzazione MediaPipe:", err)
    }
  }
}

const stopCamera = () => {
  isCameraActive.value = false
  window.removeEventListener('keydown', handleKeyboard)
  if (camera) { camera.stop(); camera = null }
  if (holistic) { holistic.close(); holistic = null }
}

const startBuffering = () => {
  signFrames.value = []
  feedbackMessage.value = ''
  feedbackType.value = ''
  appState.value = 'BUFFERING'
}

const submitSign = async () => {
  if (signFrames.value.length < MIN_FRAMES) return
  isPredicting.value = true
  const framesToSend = [...signFrames.value]
  signFrames.value = []

  const targetUrl = currentQuestion.value.level === 'level_1'
    ? 'http://127.0.0.1:8000/recognize-letter' 
    : 'http://127.0.0.1:8000/recognize-sign'

  try {
    const response = await $fetch(targetUrl, {
      method: 'POST',
      headers: { 'Authorization': token.value },
      body: { frames: framesToSend, target_word: currentQuestion.value.targetWord }
    })

    appState.value = 'IDLE'
    const confidencePercent = Math.round(response.confidence * 100)

    if (response.is_correct) {
      feedbackType.value = 'success'
      feedbackMessage.value = `Correct! AI recognized "${response.predicted_word}" (${confidencePercent}%).`
      feedbackHints.value = []
      score.value++
      stopCamera()
      setTimeout(nextQuestion, 2000)
    } else {
      // MODIFICATO: Rimossa la riduzione dei tentativi (attemptsLeft.value--)
      // per consentire sessioni di registrazione infinite fino al successo o al salto della domanda.
      feedbackType.value = 'error'
      feedbackHints.value = response.feedback || []
      
      // Nuovo messaggio esplicativo per guidare l'utente
      feedbackMessage.value = `Wrong sign. AI detected "${response.predicted_word}" (${confidencePercent}%). Try again (Press [N]) or use "Skip Question" to move on.`
    }
  } catch (error) {
    console.error("Errore di inferenza:", error)
    appState.value = 'IDLE'
  } finally {
    isPredicting.value = false
  }
}

const handleKeyboard = (e) => {
  if (!isCameraActive.value) return
  const key = e.key.toLowerCase()
  if (key === 'n' && appState.value === 'IDLE') {
    e.preventDefault()
    startBuffering()
  } else if (key === ' ' && appState.value === 'BUFFERING') {
    e.preventDefault()
    if (signFrames.value.length >= MIN_FRAMES) submitSign()
  } else if (key === 'l') {
    e.preventDefault()
    showLandmarks.value = !showLandmarks.value
  } else if (key === 'q') {
    e.preventDefault()
    stopCamera()
  }
}

// ==============================================
// GESTIONE FLUSSO DOMANDE
// ==============================================
const startQuiz = async () => {
  if (!selectedDifficulty.value) return
  
  errorMessage.value = ''
  try {
    // Chiamata corretta all'endpoint '/api/quiz/start' per evitare il 404
    const response = await $fetch(`http://localhost:8000/api/quiz/start?difficulty=${selectedDifficulty.value}`, {
      method: 'GET',
      headers: { 'Authorization': token.value }
    })

    // Se i segni sbloccati sono insufficienti, il backend restituisce lo status 'error'
    if (response.status === 'error' && response.code === 'INSUFFICIENT_SIGNS') {
      errorMessage.value = response.message
      return
    }

    // Mappatura e formattazione dei quesiti se la validazione ha esito positivo
    questions.value = response.questions.map(q => {
      let textPrompt = 'Which word corresponds to this sign?'
      if (q.type === 'recognition') {
        textPrompt = 'Perform the following sign in front of the camera:'
      } else if (q.type === 'word-sign') {
        textPrompt = 'Which sign corresponds to this word?'
      }

      return {
        id: q.question_index,
        type: q.type,
        questionText: textPrompt,
        targetWord: q.target_word,
        targetMedia: q.target_media,
        options: q.options.map((opt, i) => ({
          id: ['A', 'B', 'C', 'D'][i],
          label: opt.toUpperCase(),
          content: opt,
          isCorrect: opt.toLowerCase() === q.target_word.toLowerCase()
        }))
      }
    })

    quizState.value = 'playing'
    currentQuestionIndex.value = 0
    score.value = 0
    
    nextTick(() => {
      resetQuestionState()
    })

  } catch (err) {
    console.error("Errore durante la generazione del quiz:", err)
    errorMessage.value = "An error occurred while generating the quiz. Please try again."
  }
}

const sendFinalScore = async () => {
  try {
    await $fetch('http://localhost:8000/api/quiz/submit', {
      method: 'POST',
      headers: { 'Authorization': token.value, 'Content-Type': 'application/json' },
      body: { score: score.value }
    })
  } catch (err) {
    console.error("Error saving score:", err)
  }
}

const resetQuestionState = () => {
  attemptsLeft.value = 3
  feedbackMessage.value = ''
  feedbackType.value = ''
  feedbackHints.value = []
  showHint.value = false
  stopCamera()
}

const handleAnswer = (option) => {
  if (feedbackType.value === 'success' || attemptsLeft.value === 0) return
  if (option.isCorrect) {
    feedbackType.value = 'success'
    feedbackMessage.value = 'Correct! Great job.'
    score.value++
    setTimeout(nextQuestion, 1500)
  } else {
    attemptsLeft.value--
    if (attemptsLeft.value > 0) {
      feedbackType.value = 'error'
      feedbackMessage.value = `Wrong. You have ${attemptsLeft.value} attempt(s) left.`
    } else {
      feedbackType.value = 'error'
      feedbackMessage.value = 'Out of attempts! Moving to the next question.'
      setTimeout(nextQuestion, 2500)
    }
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    resetQuestionState()
  } else {
    quizState.value = 'result'
    sendFinalScore()
  }
}

const skipQuestion = () => {
  feedbackType.value = 'info'
  feedbackMessage.value = 'Question skipped. Moving to the next one...'
  stopCamera()
  setTimeout(nextQuestion, 1500)
}

onBeforeUnmount(() => { stopCamera() })
</script>

<template>
  <div>
    <div class="flex min-h-[calc(100vh-140px)] bg-white dark:bg-transparent transition-colors duration-200">
      
      <AppSidebar />

      <div class="flex-1 px-4 lg:px-8 py-8 w-full max-w-7xl mx-auto relative flex flex-col">
        <div class="w-full flex flex-col gap-6 flex-1">

          <div v-if="quizState === 'intro'" class="w-full flex flex-col gap-8">
            
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between shadow-sm w-full">
              <div class="flex items-center gap-4">
                <div class="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <UIcon name="i-lucide-brain" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sign Quiz</h1>
                    <UButton 
                      icon="i-lucide-info" 
                      color="primary" 
                      variant="ghost" 
                      size="xs" 
                      class="rounded-full hover:scale-110 transition-transform" 
                      @click="isInfoModalOpen = true" 
                    />
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Test yourself to consolidate the signs you have learned. Choose a category to start.</p>
                </div>
              </div>
            </div>

            <div class="mt-4 w-full">
              <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Select Category</h2>
              <div id="tour-quiz-cards" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UCard
                  v-for="level in difficultyLevels"
                  :key="level.id"
                  class="cursor-pointer transition-all duration-200 group border-2"
                  :class="[
                    selectedDifficulty === level.id
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md ring-1 ring-primary-500'
                    : 'border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm'
                  ]"
                  :ui="{ body: 'p-6 sm:p-8', rounded: 'rounded-2xl' }"
                  @click="selectCategory(level.id)"
                >
                  <div class="flex items-start gap-5">
                    <div 
                      class="p-4 rounded-full transition-colors"
                      :class="[
                        selectedDifficulty === level.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:text-primary-600'
                      ]"
                    >
                      <UIcon :name="level.icon" class="w-8 h-8" />
                    </div>
                    <div>
                      <h3 
                        class="text-xl font-bold transition-colors"
                        :class="selectedDifficulty === level.id ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white group-hover:text-primary-600'"
                      >
                      {{ level.title }}
                      </h3>
                      <p class="text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      {{ level.description }}
                      </p>
                    </div>
                  </div>
                </UCard>

              </div>
            </div>

            <div v-if="errorMessage" class="max-w-md mx-auto mt-6 text-left">
              <UAlert
                color="red"
                variant="soft"
                icon="i-lucide-alert-triangle"
                title="Requirement Error"
                :description="errorMessage"
              />
            </div>

            <div class="flex justify-center mt-8">
              <UButton 
                size="xl" 
                color="primary" 
                variant="solid" 
                class="px-12 py-4 text-xl font-bold shadow-md transition-all" 
                :class="{ 'opacity-50 cursor-not-allowed': !selectedDifficulty, 'hover:scale-105': selectedDifficulty }"
                :disabled="!selectedDifficulty"
                :ui="{ rounded: 'rounded-xl' }"
                @click="startQuiz"
              > 
              Start Quiz
              </UButton>
            </div>

          </div>

          <div v-else-if="quizState === 'playing'" class="w-full max-w-5xl mx-auto flex flex-col flex-1 justify-center">
            <div class="mb-6">
              <div class="flex justify-between text-base font-bold text-gray-500 mb-2 px-1">
                <span>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</span>
                <span class="text-primary-600 dark:text-primary-400">Score: {{ score }}</span>
              </div>
              <UProgress :value="(currentQuestionIndex / questions.length) * 100" color="primary" size="sm" />
            </div>

            <UCard class="w-full flex-1 shadow-xl border-t-8 border-t-primary-500 rounded-2xl flex flex-col" :ui="{ body: 'p-6 sm:p-8 flex flex-col justify-center flex-1' }">
              <template #header>
                <h2 class="text-xl md:text-3xl font-extrabold text-center py-2 text-gray-900 dark:text-white leading-tight">
                  {{ currentQuestion.questionText }}
                </h2>
              </template>

              <div v-if="currentQuestion.type === 'word-sign'" class="flex flex-col items-center gap-8 py-4 w-full">
                <h3 class="text-3xl md:text-4xl font-black text-primary-600 dark:text-primary-400 tracking-widest uppercase bg-primary-50 dark:bg-primary-950/30 px-8 py-4 rounded-xl border border-primary-200 dark:border-primary-800">
                  {{ currentQuestion.targetWord }}
                </h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                  <UCard 
                    v-for="option in currentQuestion.options" 
                    :key="option.id"
                    class="cursor-pointer hover:border-primary-500 hover:shadow-lg transition-all text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border-2 border-transparent"
                    @click="handleAnswer(option)"
                  >
                    <div class="relative py-4 flex items-center justify-center min-h-[200px] md:min-h-[240px] bg-white dark:bg-gray-900 rounded-lg p-2 shadow-inner">
                      <img 
                        :src="`http://localhost:8000/gif_output/${option.content.toLowerCase()}.gif`" 
                        alt="Sign Option" 
                        class="h-44 md:h-48 w-full object-contain mx-auto transition-transform hover:scale-105"
                      />
                    </div>
                    <p class="font-extrabold text-lg mt-3 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-2">
                      Option {{ option.id }}
                    </p>
                  </UCard>
                </div>

                <div class="flex justify-center mt-2">
                  <UButton 
                    color="gray" 
                    variant="soft" 
                    icon="i-lucide-fast-forward" 
                    class="font-bold py-2 px-6 rounded-xl transition-all hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-800" 
                    @click="skipQuestion"
                  >
                    Skip Question
                  </UButton>
                </div>
              </div>

              <div v-if="currentQuestion.type === 'sign-word'" class="flex flex-col items-center gap-8 py-4 w-full">
                
                <UCard class="w-full max-w-2xl aspect-video flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
                  <img 
                    v-if="currentQuestion.targetMedia.startsWith('http')" 
                    :src="currentQuestion.targetMedia" 
                    alt="Sign Animation"
                    class="w-full h-full object-contain"
                  />
                  <UIcon 
                    v-else 
                    :name="currentQuestion.targetMedia" 
                    class="w-32 h-32 md:w-40 md:h-40 text-gray-700 dark:text-gray-300 mx-auto" 
                  />
                </UCard>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                  <UButton 
                    v-for="option in currentQuestion.options" 
                    :key="option.id"
                    size="lg" color="gray" variant="outline"
                    class="justify-center text-lg md:text-xl font-bold py-4 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors shadow-sm"
                    @click="handleAnswer(option)"
                  >
                    {{ option.label }}
                  </UButton>
                </div>

                <div class="flex justify-center mt-2">
                  <UButton 
                    color="gray" 
                    variant="soft" 
                    icon="i-lucide-fast-forward" 
                    class="font-bold py-2 px-6 rounded-xl transition-all hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-800" 
                    @click="skipQuestion"
                  >
                    Skip Question
                  </UButton>
                </div>
              </div>

              <div v-if="currentQuestion.type === 'recognition'" class="flex flex-col items-center gap-6 py-4">
                <h3 class="text-3xl md:text-4xl font-black text-primary-600 dark:text-primary-400 tracking-widest uppercase bg-primary-50 dark:bg-primary-950/30 px-8 py-4 rounded-xl border border-primary-200 dark:border-primary-800">
                  {{ currentQuestion.targetWord }}
                </h3>

                <div class="w-full aspect-video bg-black rounded-2xl flex items-center justify-center overflow-hidden border-4 border-gray-200 dark:border-gray-700 relative shadow-lg">
                  
                  <div v-if="!isCameraActive" class="text-center text-white p-6">
                    <UIcon name="i-lucide-camera-off" class="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p class="text-xl font-bold mb-4">The camera is off.</p>
                    <UButton size="md" color="primary" class="px-6 py-3 text-base font-bold rounded-lg shadow" @click="activateCamera">
                      Activate Camera
                    </UButton>
                  </div>

                  <div v-else class="w-full h-full relative flex items-center justify-center">
                    <video ref="videoElement" class="absolute inset-0 w-full h-full object-contain transform scale-x-[-1]" autoplay playsinline></video>
                    <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-contain transform scale-x-[-1] pointer-events-none z-10"></canvas>
                    
                    <div class="absolute top-4 left-4 z-20 bg-black/80 px-4 py-2 rounded-xl text-white font-mono text-xs space-y-1 border border-gray-700 shadow-md">
                      <p v-if="appState === 'IDLE'" class="text-yellow-400 font-bold flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span> IDLE - Press [N] to Record - [SPACE] to Submit
                      </p>
                      <p v-else class="text-blue-400 font-bold flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span> RECORDING ({{ signFrames.length }}/{{ maxFrames }})
                      </p>
                    </div>

                    <div v-if="isPredicting" class="absolute inset-0 z-15 bg-black/50 flex items-center justify-center">
                      <UIcon name="i-lucide-loader-2" class="w-16 h-16 text-primary-500 animate-spin" />
                    </div>

                    <div class="absolute bottom-0 left-0 h-1.5 bg-gray-800 w-full z-20">
                      <div class="h-full bg-blue-500 transition-all duration-75" :style="{ width: `${(signFrames.length / maxFrames) * 100}%` }"></div>
                    </div>
                  </div>
                </div>

                <UButton v-if="!showHint" color="amber" variant="soft" size="md" icon="i-lucide-help-circle" class="font-bold py-2 px-4 mt-2 rounded-lg" @click="showHint = true">
                  Don't remember the sign? Watch the hint
                </UButton>

                <UButton 
                color="gray" 
                variant="soft" 
                size="md" 
                icon="i-lucide-fast-forward" 
                class="font-bold py-2 px-6 rounded-lg transition-all hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-800" 
                @click="skipQuestion">
                Skip Question
              </UButton>
                
                <transition name="fade">
                <div v-if="showHint" class="mt-6 flex flex-col items-center animate-fade-in w-full">
                  <p class="text-sm font-bold text-amber-500 dark:text-amber-400 mb-3 tracking-wide uppercase flex items-center gap-2">
                    <UIcon name="i-lucide-lightbulb" class="w-4 h-4" /> Reference Sign Animation:
                  </p>
                  <div class="w-full max-w-xl aspect-video rounded-2xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 bg-gray-100 dark:bg-gray-950 p-3 flex items-center justify-center shadow-lg transition-all duration-300">
                    <img 
                      :src="currentQuestion.targetMedia" 
                      alt="ASL Hint Animation" 
                      class="w-full h-full object-contain rounded-xl shadow-inner" 
                    />
                  </div>
                </div>
              </transition>
              </div>

              <template #footer>
                <div class="py-1 text-center text-sm text-gray-400 dark:text-gray-500">
                  DuoSigna Evaluation System
                </div>
              </template>
            </UCard>
          </div>

          <div v-else-if="quizState === 'result'" class="w-full flex flex-col items-center gap-8">
            <UCard class="w-full max-w-xl shadow-xl border-t-8 border-t-primary-500 rounded-3xl">
              <div class="py-10 px-6 text-center">
                <UIcon name="i-lucide-trophy" class="w-24 h-24 text-yellow-500 mx-auto mb-4 drop-shadow-md" />
                <h2 class="text-3xl lg:text-4xl font-black mb-3 text-gray-900 dark:text-white tracking-tight">Quiz Completed!</h2>
                <p class="text-lg text-gray-500 dark:text-gray-400 mb-6">Here is your final report.</p>
                
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-gray-800">
                  <p class="text-5xl md:text-6xl font-black text-primary-600 dark:text-primary-400 mb-2">{{ score }} / {{ questions.length }}</p>
                  <p class="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Correct Answers</p>
                </div>

                <div class="flex flex-col sm:flex-row justify-center gap-3">
                  <UButton size="lg" color="gray" variant="solid" class="px-6 py-2 text-base font-bold rounded-xl" to="/homepage">Back to Home</UButton>
                  <UButton size="lg" color="primary" icon="i-lucide-rotate-ccw" class="px-6 py-2 text-base font-bold rounded-xl shadow" @click="startQuiz">Retake Quiz</UButton>
                </div>
              </div>
            </UCard>
          </div>

        </div>
      </div>
    </div>
    <ClientOnly>
      <Teleport to="body">
        <transition name="modal-fade">
          <div v-if="isInfoModalOpen" class="fixed inset-0 z-[995] flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-4 sm:p-6" @click.self="isInfoModalOpen = false">
            <UCard class="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden" :ui="{ divide: 'divide-y divide-gray-100 dark:divide-gray-800', body: 'p-6' }">
              
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <UIcon name="i-lucide-info" class="w-6 h-6" />
                    <h3 class="text-xl font-black tracking-wide uppercase text-gray-900 dark:text-white">How to use the Quiz</h3>
                  </div>
                  <UButton color="gray" variant="ghost" icon="i-lucide-x" class="-my-1" @click="isInfoModalOpen = false" />
                </div>
              </template>
              
              <div class="space-y-6 py-2">
                <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  Welcome to the <b>DuoSigna Quiz</b>! Test your knowledge and reinforce the signs you've unlocked. Here is how it works:
                </p>

                <div class="space-y-5">
                  <div class="flex gap-4 items-start">
                    <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                      <UIcon name="i-lucide-layers" class="w-6 h-6" />
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 dark:text-white text-lg">Choose your Challenge</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                        Select a category between <b>Alphabet</b>, <b>Static Signs</b>, <b>Dynamic Signs</b>, or <b>Mixed</b>. You will only be tested on signs you have successfully unlocked in the Chatbot!
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-4 items-start">
                    <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                      <UIcon name="i-lucide-shuffle" class="w-6 h-6" />
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 dark:text-white text-lg">Multiple Formats</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                        Answer multiple-choice questions by matching words to signs or signs to words. You have <b>3 attempts</b> for these standard questions.
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-4 items-start">
                    <div class="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl mt-1">
                      <UIcon name="i-lucide-camera" class="w-6 h-6" />
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 dark:text-white text-lg">Webcam Recognition</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                        For the ultimate test, the AI will ask you to perform a sign live! You have <b>unlimited attempts</b> to get it right. Read the correction hints or use "Skip Question" if you get stuck.
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
        <transition name="slide-up">
          <div v-if="feedbackMessage" class="fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-6 flex justify-center pointer-events-none">
            <div class="w-full max-w-xl pointer-events-auto">
              <UAlert
                :color="feedbackType === 'success' ? 'green' : feedbackType === 'info' ? 'blue' : 'red'"
                :icon="feedbackType === 'success' ? 'i-lucide-check-circle' : feedbackType === 'info' ? 'i-lucide-fast-forward' : 'i-lucide-alert-circle'"
                :title="feedbackMessage"
                variant="solid" 
                class="w-full text-base md:text-lg py-4 px-6 rounded-2xl border-t-4 shadow-2xl text-center"
                :class="[
                  feedbackType === 'success' ? 'border-green-700 bg-green-600/95 backdrop-blur-md' : 
                  feedbackType === 'info' ? 'border-blue-700 bg-blue-600/95 backdrop-blur-md' : 
                  'border-red-700 bg-red-600/95 backdrop-blur-md'
                ]"
                :ui="{ 
                  title: 'text-lg md:text-xl font-bold text-center w-full block tracking-wide text-white', 
                  icon: { base: 'w-6 h-6 text-white' } 
                }"
              >
                <template #description v-if="feedbackType === 'error' && feedbackHints.length > 0">
                  <div class="mt-3 text-left text-xs md:text-sm bg-black/20 p-3 rounded-xl border border-white/10 max-w-md mx-auto">
                    <p class="font-extrabold text-white mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-yellow-300" /> Correction Hints:
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-gray-100">
                      <li v-for="(hint, i) in feedbackHints" :key="i">
                        {{ hint.message }}
                      </li>
                    </ul>
                  </div>
                </template>
              </UAlert>
            </div>
          </div>
        </transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Transizione Slide-Up per il Popup in sovraimpressione */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Transizione per il modale info */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

</style>