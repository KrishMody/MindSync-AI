// ============================
// Settings — Profile & Account
// ============================
import { auth } from './firebase.js';
import { updateProfile, deleteUser } from 'firebase/auth';
import { showToast } from './auth.js';
import { showPage } from './router.js';
import { updateUserIdentityUI } from './demo.js';

// ============================
// Init — populate form on open
// ============================
export function initSettingsPage() {
    const user    = auth.currentUser;
    const nameEl  = document.getElementById('settings-name');
    const emailEl = document.getElementById('settings-email');
    const avatarEl = document.getElementById('settings-avatar-display');

    const storedName = localStorage.getItem('currentUserName');

    if (nameEl) {
        nameEl.value = user?.displayName || storedName || '';
    }
    if (emailEl) {
        emailEl.value = user?.email || localStorage.getItem('currentUserEmail') || '';
    }
    if (avatarEl) {
        avatarEl.textContent = localStorage.getItem('currentUserInitials') || 'KM';
    }

    // Reset delete confirmation state
    const confirmRow = document.getElementById('delete-confirm-row');
    const deleteBtn  = document.getElementById('delete-account-btn');
    if (confirmRow) confirmRow.style.display = 'none';
    if (deleteBtn)  deleteBtn.style.display  = 'inline-flex';
}

// ============================
// Save Profile
// ============================
export async function saveProfileSettings() {
    const nameEl = document.getElementById('settings-name');
    const name   = nameEl?.value.trim();

    if (!name) {
        showToast('Name cannot be empty.', 'error');
        return;
    }

    const initials = name.split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    localStorage.setItem('currentUserName', name);
    localStorage.setItem('currentUserInitials', initials);
    updateUserIdentityUI();

    // Update avatar preview on settings page
    const avatarEl = document.getElementById('settings-avatar-display');
    if (avatarEl) avatarEl.textContent = initials;

    // Sync to Firebase if real user
    const user = auth.currentUser;
    if (user) {
        try {
            await updateProfile(user, { displayName: name });
        } catch (e) {
            console.warn('[MindSync] Firebase displayName update failed:', e.message);
        }
    }

    showToast('Profile updated.', 'success');
}

// ============================
// Delete Account — 2-step flow
// ============================
export function initiateDeleteAccount() {
    document.getElementById('delete-confirm-row').style.display = 'flex';
    document.getElementById('delete-account-btn').style.display  = 'none';
}

export function cancelDeleteAccount() {
    document.getElementById('delete-confirm-row').style.display = 'none';
    document.getElementById('delete-account-btn').style.display  = 'inline-flex';
}

export async function confirmDeleteAccount() {
    const user = auth.currentUser;

    if (!user) {
        // Demo mode — just clear and return to landing
        localStorage.clear();
        showPage('page-landing');
        return;
    }

    try {
        await deleteUser(user);
        localStorage.clear();
        showToast('Account deleted.', 'success');
        showPage('page-landing');
    } catch (err) {
        // Firebase requires recent login for deletion
        if (err.code === 'auth/requires-recent-login') {
            showToast('Please sign out and sign back in before deleting your account.', 'error');
        } else {
            showToast(err.message, 'error');
        }
        cancelDeleteAccount();
    }
}
