// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEHSWbEijPPt8LGJliZsVusaK9Pp4shbY",
  authDomain: "quotewall-6cca6.firebaseapp.com",
  projectId: "quotewall-6cca6",
  storageBucket: "quotewall-6cca6.firebasestorage.app",
  messagingSenderId: "571678478297",
  appId: "1:571678478297:web:be27229b99a6667de953c8",
  measurementId: "G-65TQ1X9SG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);