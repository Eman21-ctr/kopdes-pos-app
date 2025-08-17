// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA01kSoUKWiD2luOcJMav_xSWHMcD5J9-M",
    authDomain: "koperasi-merah-putih-pos.firebaseapp.com",
    projectId: "koperasi-merah-putih-pos",
    storageBucket: "koperasi-merah-putih-pos.firebasestorage.app",
    messagingSenderId: "1082196355346",
    appId: "1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);