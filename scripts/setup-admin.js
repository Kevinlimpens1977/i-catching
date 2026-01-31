/**
 * Admin User Setup Script
 * 
 * Run this script to create your admin user document in Firestore.
 * 
 * Prerequisites:
 * 1. Create a user in Firebase Console > Authentication
 * 2. Copy the user's UID
 * 3. Update the ADMIN_UID below
 * 4. Run: node scripts/setup-admin.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config (from .env)
const firebaseConfig = {
    apiKey: "AIzaSyAUKZzF_OdmiiSDjLTY9-4sfxAMVBR_hk0",
    authDomain: "i-catching.firebaseapp.com",
    projectId: "i-catching",
    storageBucket: "i-catching.firebasestorage.app",
    messagingSenderId: "377716185319",
    appId: "1:377716185319:web:61ed33295ec3c257272a42",
    measurementId: "G-80QWWFNLY3"
};

// ========================================
// CONFIGUREER HIER JE ADMIN USER
// ========================================

// Stap 1: Maak een user aan in Firebase Console > Authentication
// Stap 2: Kopieer de UID van die user en plak hieronder
const ADMIN_UID = 'PLAK_HIER_JE_USER_UID';

// Het email adres van je admin user
const ADMIN_EMAIL = 'admin@i-catching.nl';

// ========================================

async function setupAdmin() {
    if (ADMIN_UID === 'PLAK_HIER_JE_USER_UID') {
        console.error('❌ Je moet eerst je user UID invullen!');
        console.log('\nStappen:');
        console.log('1. Ga naar Firebase Console > Authentication');
        console.log('2. Klik op "Add user" en maak een nieuwe user aan');
        console.log('3. Kopieer de UID van de nieuwe user');
        console.log('4. Open dit bestand en vervang PLAK_HIER_JE_USER_UID met je UID');
        console.log('5. Voer dit script opnieuw uit');
        process.exit(1);
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        await setDoc(doc(db, 'users', ADMIN_UID), {
            email: ADMIN_EMAIL,
            role: 'admin',
            createdAt: serverTimestamp()
        });

        console.log('✅ Admin user aangemaakt!');
        console.log(`   UID: ${ADMIN_UID}`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Role: admin`);
        console.log('\nJe kunt nu inloggen op /admin/login');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fout bij aanmaken admin user:', error);
        process.exit(1);
    }
}

setupAdmin();
