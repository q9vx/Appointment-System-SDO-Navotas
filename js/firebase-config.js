const firebaseConfig = {
  apiKey: "AIzaSyBx1vhenMzO-gEFNDHBzos2OZn7BrjmSg8",
  authDomain: "sdo-appointmentsystemnavotas.firebaseapp.com",
  projectId: "sdo-appointmentsystemnavotas",
  storageBucket: "sdo-appointmentsystemnavotas.firebasestorage.app",
  messagingSenderId: "761764979772",
  appId: "1:761764979772:web:b455efe57159a56d134f39",
  measurementId: "G-C5FXM7K62H"
};

const app = initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();