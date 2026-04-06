// ============================
// Firestore Sync — Check-ins
// ============================
import { db, auth } from './firebase.js';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Writes a single check-in to Firestore under users/{uid}/checkins/{dateString}.
 * Silently no-ops if no user is logged in (e.g. demo mode).
 */
export async function syncCheckinToFirestore(dateString, checkinData) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const ref = doc(db, 'users', user.uid, 'checkins', dateString);
        await setDoc(ref, checkinData);
    } catch (err) {
        console.warn('[MindSync] Firestore write failed:', err.message);
    }
}

/**
 * Pulls all check-ins for the current user from Firestore and writes them
 * into localStorage. Overwrites any existing local entries so Firestore
 * is always the source of truth on a fresh login.
 */
export async function pullCheckinsFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const checkinsRef = collection(db, 'users', user.uid, 'checkins');
        const snapshot    = await getDocs(checkinsRef);
        snapshot.forEach(docSnap => {
            localStorage.setItem('dailyCheckIn_' + docSnap.id, JSON.stringify(docSnap.data()));
        });
    } catch (err) {
        console.warn('[MindSync] Firestore pull failed:', err.message);
    }
}
