// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// هنا جمعنا كل الاستدعاءات في سطر واحد عشان نتجنب التكرار والأخطاء
// Ici nous avons rassemblé toutes les importations sur une seule ligne pour éviter les doublons et les erreurs
import { addDoc, collection, getDocs, getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBCYo4Utz8GDnEZ1iHqkJHwy0ZMieNRr8",
  authDomain: "club-cafe-cc.firebaseapp.com",
  projectId: "club-cafe-cc",
  storageBucket: "club-cafe-cc.appspot.com",
  messagingSenderId: "776006317626",
  appId: "1:776006317626:web:6dccdd3748d908c68a6703"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it for other files
export const db = getFirestore(app);

// دالة الإضافة العالمية
// Fonction d'ajout globale
window.addMenuItemToFirebase = async function(data) {
    return await addDoc(collection(db, "menu"), {
        ...data,
        createdAt: serverTimestamp()
    });
};

// دالة جلب الأصناف من قاعدة البيانات 
// Fonction de récupération des articles de la base de données
window.fetchMenuItemsFromFirebase = async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "menu"));
    const fetchedItems = [];
    
    querySnapshot.forEach((doc) => {
      fetchedItems.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("تم جلب الأصناف بنجاح:", fetchedItems);
    return fetchedItems;
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
    return [];
  }
};
// دالة إرسال الطلبات العالمية
// Fonction globale d'envoi des commandes
window.addOrderToFirebase = async function(orderData) {
    return await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp() // وقت السيرفر الدقيق / Heure exacte du serveur
    });
};