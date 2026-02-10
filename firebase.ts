import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Configuration Firebase utilisant les variables d'environnement
const firebaseConfig = {
  // Utilise process.env.API_KEY injecté par Netlify ou la clé par défaut si non définie
  apiKey: process.env.API_KEY || "AIzaSyBm9ygLFMi9wcZoMvv3wBfMj22QL2agB-E",
  authDomain: "martiloveconect.firebaseapp.com",
  databaseURL: "https://martiloveconect-default-rtdb.firebaseio.com",
  projectId: "martiloveconect",
  storageBucket: "martiloveconect.firebasestorage.app",
  messagingSenderId: "611787439889",
  appId: "1:611787439889:web:67cd56a725801cd8b5d6b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);