import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Seus dados da imagem
const firebaseConfig = {
  apiKey: "AIzaSyA2TJbOalfG7vvdOok7mMBx5uQmQJ5A238",
  authDomain: "missaofits.firebaseapp.com",
  projectId: "missaofits",
  storageBucket: "missaofits.firebasestorage.app",
  messagingSenderId: "185988532482",
  appId: "1:185988532482:web:58542ebe20b57aa20dda1b",
  measurementId: "G-6WM79TJ595"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);