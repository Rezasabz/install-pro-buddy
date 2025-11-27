/**
 * سیستم احراز هویت - متصل به API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://185.92.182.51:8000';

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  role: 'admin' | 'partner';
  partnerId?: string;
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'auth_user';

// Register function removed - only admin can create users

/**
 * ورود کاربر
 */
export async function login(
  mobile: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.detail || 'خطا در ورود' 
      };
    }

    const user: User = await response.json();

    // ذخیره اطلاعات کاربر در localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    return { 
      success: true, 
      message: 'ورود با موفقیت انجام شد', 
      user 
    };
  } catch (error) {
    console.error('خطا در ورود:', error);
    return { success: false, message: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید' };
  }
}

/**
 * خروج کاربر
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * دریافت کاربر فعلی
 */
export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * بررسی لاگین بودن کاربر
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
