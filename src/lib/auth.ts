/**
 * سیستم احراز هویت
 */

export interface User {
  id: string;
  fullName: string;
  mobile: string; // نام کاربری (شماره موبایل)
  password: string; // هش شده
  createdAt: string;
}

const STORAGE_KEY = 'auth_user';
const USERS_KEY = 'users';

/**
 * هش ساده رمز عبور (در production باید از bcrypt استفاده شود)
 */
function hashPassword(password: string): string {
  // در production باید از bcrypt یا argon2 استفاده شود
  // این فقط برای demo است
  return btoa(password + 'salt_key_2024');
}

/**
 * بررسی رمز عبور
 */
function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

/**
 * دریافت تمام کاربران
 */
function getAllUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * ذخیره کاربران
 */
function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * ثبت‌نام کاربر جدید
 */
export async function register(
  fullName: string,
  mobile: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // اعتبارسنجی
    if (!fullName || fullName.trim().length < 3) {
      return { success: false, message: 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد' };
    }

    if (!mobile || !/^09\d{9}$/.test(mobile)) {
      return { success: false, message: 'شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' };
    }

    const users = getAllUsers();

    // بررسی تکراری بودن شماره موبایل
    if (users.some(u => u.mobile === mobile)) {
      return { success: false, message: 'این شماره موبایل قبلاً ثبت شده است' };
    }

    // ایجاد کاربر جدید
    const newUser: User = {
      id: Date.now().toString(),
      fullName: fullName.trim(),
      mobile,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // لاگین خودکار
    const userWithoutPassword = { ...newUser, password: '' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));

    return { 
      success: true, 
      message: 'ثبت‌نام با موفقیت انجام شد', 
      user: userWithoutPassword 
    };
  } catch (error) {
    console.error('خطا در ثبت‌نام:', error);
    return { success: false, message: 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید' };
  }
}

/**
 * ورود کاربر
 */
export async function login(
  mobile: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // اعتبارسنجی
    if (!mobile || !password) {
      return { success: false, message: 'لطفاً شماره موبایل و رمز عبور را وارد کنید' };
    }

    const users = getAllUsers();
    const user = users.find(u => u.mobile === mobile);

    if (!user) {
      return { success: false, message: 'شماره موبایل یا رمز عبور اشتباه است' };
    }

    if (!verifyPassword(password, user.password)) {
      return { success: false, message: 'شماره موبایل یا رمز عبور اشتباه است' };
    }

    // ذخیره اطلاعات کاربر (بدون رمز عبور)
    const userWithoutPassword = { ...user, password: '' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));

    return { 
      success: true, 
      message: 'ورود با موفقیت انجام شد', 
      user: userWithoutPassword 
    };
  } catch (error) {
    console.error('خطا در ورود:', error);
    return { success: false, message: 'خطا در ورود. لطفاً دوباره تلاش کنید' };
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
