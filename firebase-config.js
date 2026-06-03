// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRwh-tQe1cV0G0-RXbxVZfF-LZ4iUQVDI",
  authDomain: "itlahore-dd2bc.firebaseapp.com",
  projectId: "itlahore-dd2bc",
  storageBucket: "itlahore-dd2bc.firebasestorage.app",
  messagingSenderId: "1055536809932",
  appId: "1:1055536809932:web:d5ab98a06b15e3c13ebf69",
  measurementId: "G-HNP4TBRX8F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, signOut, 
         collection, addDoc, getDocs, query, where, updateDoc, 
         doc, orderBy, getDoc, setDoc, deleteDoc };