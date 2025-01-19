import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCBvcY4anPF7kz6BXSf1qhU9rFeGgYmqUM",
  authDomain: "aichitect-acd20.firebaseapp.com",
  projectId: "aichitect-acd20",
  storageBucket: "aichitect-acd20.firebasestorage.app",
  messagingSenderId: "102506170954",
  appId: "1:102506170954:web:80320b39e65e069b3ab4b3",
  measurementId: "G-8N0LBM8BRG"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
