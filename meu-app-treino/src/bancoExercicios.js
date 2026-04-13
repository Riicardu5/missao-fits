const imgEx = "https://www.svgrepo.com/show/335198/dumbbell.svg"; 
const imgMusc = "https://www.svgrepo.com/show/157297/muscle.svg"; 


export const bancoExercicios = [
  // --- PEITORAL ---
  { id: "sup_reto_barra", nome: "Supino Reto (Barra)", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif", musculoImg: imgMusc },
  { id: "sup_reto_halt", nome: "Supino Reto (Halteres)", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Bench-Press.gif", musculoImg: imgMusc },
  { id: "sup_inc_barra", nome: "Supino Inclinado (Barra)", musculo: "Peito Superior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Incline-Bench-Press.gif", musculoImg: imgMusc },
  { id: "sup_inc_halt", nome: "Supino Inclinado (Halteres)", musculo: "Peito Superior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif", musculoImg: imgMusc },
  { id: "crucifixo", nome: "Crucifixo Reto", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Fly.gif", musculoImg: imgMusc },
  { id: "cross_over", nome: "Cross Over (Polia Alta)", musculo: "Peito Inferior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Cross-over.gif", musculoImg: imgMusc },
  { id: "voador_peitoral", nome: "Voador / Pec Deck", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Chest-Fly.gif", musculoImg: imgMusc },
  { id: "sup_declinado", nome: "Supino Declinado", musculo: "Peito Inferior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Decline-Bench-Press.gif", musculoImg: imgMusc },
  { id: "supino_maq", nome: "Supino Máquina", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Chest-Press.gif", musculoImg: imgMusc },
  { id: "crucifixo_maq", nome: "Crucifixo Máquina", musculo: "Peito", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Fly.gif", musculoImg: imgMusc },

  // --- COSTAS ---
  { id: "puxada_frente", nome: "Puxada Frente", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif", musculoImg: imgMusc },
  { id: "remada_curvada", nome: "Remada Curvada (Barra)", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif", musculoImg: imgMusc },
  { id: "remada_baixa", nome: "Remada Baixa (Triângulo)", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif", musculoImg: imgMusc },
  { id: "serrote", nome: "Remada Unilateral (Serrote)", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif", musculoImg: imgMusc },
  { id: "barra_fixa", nome: "Barra Fixa", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif", musculoImg: imgMusc },
  { id: "puxada_triangulo", nome: "Puxada Triângulo", musculo: "Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/V-bar-Pull-down.gif", musculoImg: imgMusc },
  { id: "pull_over_corda", nome: "Pull Over na Polia (Corda)", musculo: "Costas/Dorsal", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Straight-Arm-Pull-down.gif", musculoImg: imgMusc },
  { id: "crucifixo_inv_maq", nome: "Crucifixo Inverso Máquina", musculo: "Costas/Ombro Post.", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Reverse-Fly.gif", musculoImg: imgMusc },

  // --- PERNAS ---
  { id: "agacha_livre", nome: "Agachamento Livre", musculo: "Pernas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif", musculoImg: imgMusc },
  { id: "leg_45", nome: "Leg Press 45°", musculo: "Pernas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif", musculoImg: imgMusc },
  { id: "extensora", nome: "Cadeira Extensora", musculo: "Quadríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Extension.gif", musculoImg: imgMusc },
  { id: "flexora", nome: "Mesa Flexora", musculo: "Posterior de Coxa", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Lying-Leg-Curl.gif", musculoImg: imgMusc },
  { id: "stiff", nome: "Stiff (Barra ou Halter)", musculo: "Posterior/Glúteo", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Stiff-Legged-Deadlift.gif", musculoImg: imgMusc },
  { id: "afundo", nome: "Afundo / Passada", musculo: "Pernas/Glúteo", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif", musculoImg: imgMusc },
  { id: "panturrilha_em_pe", nome: "Panturrilha em Pé", musculo: "Panturrilha", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Calf-Raise.gif", musculoImg: imgMusc },
  { id: "hack_machine", nome: "Agachamento no Hack", musculo: "Pernas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Sled-Hack-Squat.gif", musculoImg: imgMusc },
  { id: "flexora_sentada", nome: "Cadeira Flexora", musculo: "Posterior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Leg-Curl.gif", musculoImg: imgMusc },
  { id: "abdutora", nome: "Cadeira Abdutora", musculo: "Glúteo/Quadril", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Hip-Abduction.gif", musculoImg: imgMusc },
  { id: "elev_pelvica", nome: "Elevação Pélvica", musculo: "Glúteo", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif", musculoImg: imgMusc },
  { id: "terra", nome: "Levantamento Terra", musculo: "Pernas/Costas", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif", musculoImg: imgMusc },
  { id: "panturrilha_sentado", nome: "Panturrilha Sentado", musculo: "Panturrilha", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Calf-Raise.gif", musculoImg: imgMusc },

  // --- BRAÇOS ---
  { id: "rosca_direta", nome: "Rosca Direta (Barra W)", musculo: "Bíceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif", musculoImg: imgMusc },
  { id: "rosca_alt", nome: "Rosca Alternada", musculo: "Bíceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif", musculoImg: imgMusc },
  { id: "rosca_martelo", nome: "Rosca Martelo", musculo: "Bíceps/Antebraço", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif", musculoImg: imgMusc },
  { id: "triceps_corda", nome: "Tríceps Corda", musculo: "Tríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif", musculoImg: imgMusc },
  { id: "triceps_testa", nome: "Tríceps Testa", musculo: "Tríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Triceps-Extension.gif", musculoImg: imgMusc },
  { id: "triceps_frances", nome: "Tríceps Francês", musculo: "Tríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Tricep-Extension.gif", musculoImg: imgMusc },
  { id: "rosca_scott", nome: "Rosca Scott", musculo: "Bíceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Preacher-Curl.gif", musculoImg: imgMusc },
  { id: "triceps_paralela", nome: "Tríceps Paralela (Banco)", musculo: "Tríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bench-Dip.gif", musculoImg: imgMusc },
  { id: "rosca_inversa", nome: "Rosca Inversa (Polia)", musculo: "Antebraço", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Reverse-Curls.gif", musculoImg: imgMusc },
  { id: "triceps_press_maq", nome: "Tríceps Press Máquina", musculo: "Tríceps", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Triceps-Extension.gif", musculoImg: imgMusc },

  // --- OMBROS ---
  { id: "desenv_halt", nome: "Desenvolvimento (Halteres)", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif", musculoImg: imgMusc },
  { id: "elev_lateral", nome: "Elevação Lateral", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif", musculoImg: imgMusc },
  { id: "elev_frontal", nome: "Elevação Frontal (Halter)", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Front-Raise.gif", musculoImg: imgMusc },
  { id: "encolhimento", nome: "Encolhimento (Trapézio)", musculo: "Trapézio", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shrug.gif", musculoImg: imgMusc },
  { id: "face_pull", nome: "Face Pull (Posterior)", musculo: "Ombro Posterior", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif", musculoImg: imgMusc },
  { id: "elev_frontal_polia", nome: "Elevação Frontal (Polia)", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Front-Raise.gif", musculoImg: imgMusc },
  { id: "elev_lateral_maq", nome: "Elevação Lateral Máquina", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Lateral-Raise.gif", musculoImg: imgMusc },
  { id: "desenv_maq", nome: "Desenvolvimento Máquina", musculo: "Ombros", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lever-Shoulder-Press.gif", musculoImg: imgMusc },

  // --- CARDIO ---
  { id: "esteira", nome: "Esteira", musculo: "Cardio", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Treadmill.gif", musculoImg: imgMusc },
  { id: "bike", nome: "Bicicleta Ergométrica", musculo: "Cardio", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Stationary-Bicycle.gif", musculoImg: imgMusc },
  { id: "escada", nome: "Escada (Stepper)", musculo: "Cardio", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Stairmaster.gif", musculoImg: imgMusc },

  // --- ABDÔMEN ---
  { id: "abdominal_supra", nome: "Abdominal Supra", musculo: "Abdômen", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Crunch.gif", musculoImg: imgMusc },
  { id: "abdominal_infra", nome: "Elevação de Pernas (Infra)", musculo: "Abdômen", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Lying-Leg-Raise.gif", musculoImg: imgMusc },
  { id: "plancha", nome: "Prancha Abdominal", musculo: "Core", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif", musculoImg: imgMusc },
  { id: "abdominal_roda", nome: "Abdominal com Roda", musculo: "Abdômen/Core", foto: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Ab-Wheel-Rollout.gif", musculoImg: imgMusc }
];