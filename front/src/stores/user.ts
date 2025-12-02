import { ref } from 'vue';
import type { User } from '@/types';

const STORAGE_KEY = 'user';

function loadInitialUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (e) {
    console.error('Failed to load user from localStorage', e);
    return null;
  }
}

const userRef = ref<User | null>(loadInitialUser());

export function useUserStore() {
  const setUser = (value: User | null) => {
    userRef.value = value;
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  };

  return {
    user: userRef,
    setUser,
  };
}


