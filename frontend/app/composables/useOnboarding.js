// composables/useOnboarding.js
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useState } from '#app'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export const useOnboarding = () => {
  const router = useRouter()
  const isOnboardingActive = useState('onboardingActive', () => false)
  const { token, getSession } = useAuth() 
  let driverObj = null

  // Chiama il backend per salvare il completamento
  const markTourAsCompleted = async () => {
    try {
      await $fetch('http://127.0.0.1:8000/complete-onboarding', {
        method: 'POST',
        headers: { 'Authorization': token.value }
      })
      await getSession()
    } catch (error) {
      console.error("Error in saving the onboarding completion:", error)
    }
  }

  // Gestore centrale di avanzamento e navigazione
  const handleCustomAdvance = async (e) => {
    if (!isOnboardingActive.value || !driverObj) return;

    // 1. Se clicca sulla 'X' in alto a destra, Driver.js chiude regolarmente
    if (e.type === 'click' && e.target.closest('.driver-popover-close-btn')) {
      return;
    }

    // 2. Click ovunque sullo schermo o Spazio/Invio
    if (e.type === 'click' || (e.type === 'keydown' && (e.code === 'Space' || e.code === 'Enter'))) {
      
      e.preventDefault();
      e.stopPropagation(); // Blocca l'interazione con gli elementi sottostanti

      const currentStepIndex = driverObj.getActiveIndex();

      // Se siamo all'ultimo step, distruggi il tour e fermati
      if (currentStepIndex === 4) {
        driverObj.destroy();
        return;
      }

      // Gestione del cambio pagina in base allo step corrente
      if (currentStepIndex === 0) {
        await router.push('/chatbot');
      } else if (currentStepIndex === 1) {
        await router.push('/dictionary');
      } else if (currentStepIndex === 2) {
        await router.push('/quiz');
      } else if (currentStepIndex === 3) {
        await router.push('/homepage');
      }

      // Attendiamo che il DOM della nuova rotta sia renderizzato prima di passare al prossimo fumetto
      setTimeout(() => {
        driverObj.moveNext();
      }, 300);
    }
  }

  const startTour = () => {
    isOnboardingActive.value = true
    
    driverObj = driver({
      showProgress: true,
      
      // FONDAMENTALE: impedisce che cliccare fuori chiuda il tour
      allowClose: false, 
      
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: 'custom-driver-popover',
      allowKeyboardControl: false, // Disattivato per non sovrapporsi al nostro listener personalizzato
      overlayColor: 'rgba(15, 23, 42, 0.8)',
      showButtons: ['close'], 
      
      onDestroyed: () => {
        // Rimozione pulita dei listener
        document.removeEventListener('click', handleCustomAdvance, { capture: true });
        document.removeEventListener('keydown', handleCustomAdvance, { capture: true });
        
        isOnboardingActive.value = false
        markTourAsCompleted()
      },
      
      // I tuoi 5 step esatti
      steps: [
        { 
          element: '#tour-welcome-card', 
          popover: { 
            title: 'Welcome', 
            description: 'Welcome to DuoSigna! This is your dashboard where you can track your score.', 
            side: 'bottom',
            align: 'start'
          }
        },
        { 
          element: '#tour-chat-input', 
          popover: { 
            title: 'Chatbot', 
            description: 'Your AI Tutor. Ask how to perform any sign, and you will receive instant feedback and reference videos.',
            side: 'top', 
            align: 'center' 
          }
        },
        {
          element: '#tour-dictionary-grid',
          popover: {
            title: 'Dictionary',
            description: 'Here you will find all the signs organized by categories. Review the ones you have unlocked!',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-quiz-cards',
          popover: {
            title: 'Quiz',
            description: 'Test your skills! Activate the webcam and show the signs you have learned to earn points.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-welcome-card', // Torna alla home sull'ultimo step
          popover: {
            title: 'Start learning',
            description: 'You are all set! Click anywhere to finish this tour and start learning ASL.',
            side: 'bottom',
            align: 'start'
          }
        }
      ]
    })

    // Attivazione dei listener personalizzati in modalità capture
    setTimeout(() => {
      document.addEventListener('click', handleCustomAdvance, { capture: true });
      document.addEventListener('keydown', handleCustomAdvance, { capture: true });
    }, 100);

    router.push('/homepage').then(() => {
      setTimeout(() => {
        driverObj.drive()
      }, 300)
    })
  }

  const stopTour = () => {
    if (driverObj) {
      driverObj.destroy()
    }
  }

  return { startTour, stopTour, isOnboardingActive }
}