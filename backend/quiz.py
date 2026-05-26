import random
from sqlalchemy.orm import Session
import models

def generate_user_quiz(db: Session, user_id: int, difficulty: str, nn_dictionary: dict, letters_dictionary: dict):
    """
    Generates a quiz based on the signs learned by the user and filtered by category.
    Requires a minimum of 3 unlocked signs in the selected category.
    """
    # 1. Recupera tutti i segni sbloccati dall'utente dal database
    learned_entries = db.query(models.LearnedSign).filter(models.LearnedSign.user_id == user_id).all()
    all_learned_words = list(set([entry.word.lower() for entry in learned_entries])) 
    
    # Divisione dei dizionari core (conversione in lowercase per sicurezza)
    alphabet_set = {w.lower() for w in letters_dictionary.keys()}
    
    # Chiavi statiche definite per il livello statico
    static_keys = ["hello", "thankyou", "please", "sorry", "yes", "no", "love", "help", "want", "good"]
    static_set = {w.lower() for w in static_keys if w in nn_dictionary}
    
    # I dinamici sono tutti i restanti segni del dizionario neurale
    dynamic_set = {w.lower() for w in nn_dictionary.keys() if w.lower() not in static_set}

    # Mappatura linguistica in inglese per i messaggi utente
    category_names = {
        'alphabet': 'Alphabet',
        'static': 'Static',
        'dynamic': 'Dynamic',
        'mixed': 'Total'
    }
    category_label = category_names.get(difficulty, 'selected')

    # 2. Applica il filtro in base alla categoria selezionata dal frontend
    if difficulty == 'alphabet':
        learned_words = [w for w in all_learned_words if w in alphabet_set]
    elif difficulty == 'static':
        learned_words = [w for w in all_learned_words if w in static_set]
    elif difficulty == 'dynamic':
        learned_words = [w for w in all_learned_words if w in dynamic_set]
    else: # 'mixed'
        learned_words = all_learned_words

    min_questions = 3

    # 3. Controllo bloccante del requisito minimo (3 segni) con stringhe in inglese
    if len(learned_words) < min_questions:
        if len(learned_words) == 0:
            msg = f"You cannot start the quiz because you haven't unlocked any signs in the {category_label} category yet. Unlock at least {min_questions} signs in the dictionary!"
        else:
            msg = f"You cannot start the quiz because you have only unlocked {len(learned_words)} signs in the {category_label} category. You need {min_questions - len(learned_words)} more to reach the minimum of {min_questions}!"
            
        return {
            "status": "error",
            "code": "INSUFFICIENT_SIGNS",
            "message": msg
        }

    # 4. Compilazione del set di domande (massimo 10)
    num_questions = min(len(learned_words), 10)
    target_words = random.sample(learned_words, num_questions)
    
    global_words = list(nn_dictionary.keys()) + list(letters_dictionary.keys())
    global_words = [w.lower() for w in global_words]

    questions = []
    for idx, correct_word in enumerate(target_words):
        possible_distractors = [w for w in global_words if w != correct_word]
        distractors = random.sample(possible_distractors, 3)
        
        options = distractors + [correct_word]
        random.shuffle(options)
        
        media_url = f"http://localhost:8000/gif_output/{correct_word.lower()}.gif"
        
        # Bilanciamento tipologie di gioco: 20% fotocamera, 40% sign-word, 40% word-sign
        rand = random.random()
        if rand < 0.25:
            question_type = 'recognition'
        elif rand < 0.625:
            question_type = 'sign-word'
        else:
            question_type = 'word-sign'
        
        questions.append({
            "question_index": idx + 1,
            "type": question_type,
            "target_word": correct_word,
            "target_media": media_url,
            "options": options
        })

    return {
        "status": "success",
        "questions": questions
    }