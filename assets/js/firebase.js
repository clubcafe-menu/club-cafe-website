// Import the functions you need from the SDKs you need via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, addDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyBBCYo4Utz8GDnEZ1iHqkJHwy0ZMIeMRr8",
  authDomain: "club-cafe-cc.firebaseapp.com",
  projectId: "club-cafe-cc",
  storageBucket: "club-cafe-cc.firebasestorage.app",
  messagingSenderId: "776006317626",
  appId: "1:776006317626:web:6dccdd3748d908c68a6703"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// دالة الإضافة العالمية
window.addMenuItemToFirebase = async function(data) {
    try {
        const docRef = await addDoc(collection(db, "menu"), {
            ...data,
            createdAt: serverTimestamp()
        });
        window.showToast("تمت الإضافة إلى Firebase بنجاح!");
        return docRef;
    } catch (e) {
        console.error("خطأ في الإضافة: ", e);
    }
};

// دالة جلب الأصناف من قاعدة البيانات وتحديث الواجهة
window.fetchMenuItemsFromFirebase = async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "menu"));
    const fetchedItems = [];
    
    querySnapshot.forEach((doc) => {
      fetchedItems.push({ id: doc.id, ...doc.data() });
    });
    
    if (fetchedItems.length > 0) {
        // تحديث المتغير العام الموجود في data.js
        window.menuItems = fetchedItems; 
        
        // حفظ البيانات في LocalStorage عشان باقي التطبيق يقرأها
        if (typeof window.saveToStorage === 'function') {
            window.saveToStorage();
        }
        
        // تحديث الواجهة إذا كانت الدالة موجودة في ui.js
        if (typeof window.renderCategoriesGrid === 'function') {
            window.renderCategoriesGrid();
        }
        
        console.log("✅ تم جلب الأصناف من Firebase بنجاح:", fetchedItems);
    }
    return fetchedItems;
  } catch (error) {
    console.error("❌ خطأ في جلب البيانات:", error);
    return [];
  }
};

// دالة إرسال الطلبات العالمية
window.addOrderToFirebase = async function(orderData) {
    return await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp()
    });
};
// دالة لجلب الطلبات من الفايربيز وتحديث لوحة الإدارة
window.fetchOrdersFromFirebase = async function() {
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetchedOrders = [];
        
        querySnapshot.forEach((doc) => {
            fetchedOrders.push({ id: doc.id, ...doc.data() });
        });
        
        if (fetchedOrders.length > 0) {
            window.ordersHistory = fetchedOrders.sort((a, b) => b.timestamp - a.timestamp); // ترتيب من الأحدث للأقدم
            
            if (typeof window.saveToStorage === 'function') {
                window.saveToStorage();
            }
            if (typeof window.updateAdminDashboard === 'function') {
                window.updateAdminDashboard();
            }
            console.log("✅ تم جلب الطلبات من Firebase بنجاح");
        }
    } catch (error) {
        console.error("❌ خطأ في جلب الطلبات:", error);
    }
};
// دالة إضافة أو تحديث الأقسام في Firebase
window.saveCategoryToFirebase = async function(catData) {
    try {
        await addDoc(collection(db, "categories"), {
            ...catData,
            createdAt: serverTimestamp()
        });
        console.log("✅ تم حفظ القسم في Firebase");
    } catch (e) {
        console.error("❌ خطأ في حفظ القسم:", e);
    }
};

// دالة إضافة أو تحديث العروض (Formules) في Firebase
window.saveFormuleToFirebase = async function(formuleData) {
    try {
        await addDoc(collection(db, "formules"), {
            ...formuleData,
            createdAt: serverTimestamp()
        });
        console.log("✅ تم حفظ العرض في Firebase");
    } catch (e) {
        console.error("❌ خطأ في حفظ العرض:", e);
    }
};