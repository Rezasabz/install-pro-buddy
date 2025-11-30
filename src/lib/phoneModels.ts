// لیست برندها و مدل‌های موبایل ترند (3 سال اخیر - 2022 تا 2024)

export interface PhoneModel {
  brand: string;
  models: string[];
}

export const phoneBrandsAndModels: PhoneModel[] = [
  {
    brand: "سامسونگ",
    models: [
      "Galaxy S25 Ultra",
      "Galaxy S25+",
      "Galaxy S25",
      "Galaxy S24 Ultra",
      "Galaxy S24+",
      "Galaxy S24",
      "Galaxy S23 Ultra",
      "Galaxy S23+",
      "Galaxy S23",
      "Galaxy S22 Ultra",
      "Galaxy S22+",
      "Galaxy S22",
      "Galaxy Z Fold 5",
      "Galaxy Z Fold 4",
      "Galaxy Z Flip 5",
      "Galaxy Z Flip 4",
      "Galaxy A54",
      "Galaxy A34",
      "Galaxy A24",
      "Galaxy A14",
      "Galaxy Note 20 Ultra",
    ],
  },
  {
    brand: "اپل",
    models: [
      "iPhone 17 Pro Max",
      "iPhone 17 Pro",
      "iPhone 17 Plus",
      "iPhone 17",
      "iPhone 17 Air",
      "iPhone 16 Pro Max",
      "iPhone 16 Pro",
      "iPhone 16 Plus",
      "iPhone 16",
      "iPhone 15 Pro Max",
      "iPhone 15 Pro",
      "iPhone 15 Plus",
      "iPhone 15",
      "iPhone 14 Pro Max",
      "iPhone 14 Pro",
      "iPhone 14 Plus",
      "iPhone 14",
      "iPhone 13 Pro Max",
      "iPhone 13 Pro",
      "iPhone 13",
      "iPhone 12 Pro Max",
      "iPhone 12 Pro",
      "iPhone 12",
    ],
  },
  {
    brand: "شیائومی",
    models: [
      "Xiaomi 14 Pro",
      "Xiaomi 14",
      "Xiaomi 13 Pro",
      "Xiaomi 13",
      "Xiaomi 13T Pro",
      "Xiaomi 13T",
      "Xiaomi 12T Pro",
      "Xiaomi 12T",
      "Redmi Note 13 Pro",
      "Redmi Note 13",
      "Redmi Note 12 Pro",
      "Redmi Note 12",
      "Redmi 13C",
      "Redmi 12",
      "POCO X6 Pro",
      "POCO X6",
      "POCO F5 Pro",
      "POCO F5",
    ],
  },
  {
    brand: "هواوی",
    models: [
      "Mate 60 Pro",
      "Mate 60",
      "Mate 50 Pro",
      "Mate 50",
      "P60 Pro",
      "P60",
      "P50 Pro",
      "P50",
      "Nova 12",
      "Nova 11",
      "Nova 10",
    ],
  },
  {
    brand: "وان پلاس",
    models: [
      "OnePlus 12",
      "OnePlus 11",
      "OnePlus 10 Pro",
      "OnePlus 10T",
      "OnePlus 9 Pro",
      "OnePlus 9",
      "OnePlus Nord 3",
      "OnePlus Nord 2",
    ],
  },
  {
    brand: "اوپو",
    models: [
      "Find X6 Pro",
      "Find X5 Pro",
      "Find X5",
      "Reno 11 Pro",
      "Reno 11",
      "Reno 10 Pro",
      "Reno 10",
      "A98",
      "A78",
      "A58",
    ],
  },
  {
    brand: "ویوو",
    models: [
      "X100 Pro",
      "X90 Pro",
      "X90",
      "V29 Pro",
      "V29",
      "V27 Pro",
      "V27",
      "Y100",
      "Y78",
      "Y56",
    ],
  },
  {
    brand: "رئال‌می",
    models: [
      "Realme GT 5 Pro",
      "Realme GT 5",
      "Realme GT 3",
      "Realme 11 Pro+",
      "Realme 11 Pro",
      "Realme 11",
      "Realme 10 Pro+",
      "Realme 10 Pro",
      "Realme C55",
      "Realme C53",
    ],
  },
  {
    brand: "نوکیا",
    models: [
      "Nokia G60",
      "Nokia XR21",
      "Nokia X30",
      "Nokia G50",
      "Nokia X20",
    ],
  },
  {
    brand: "گوگل",
    models: [
      "Pixel 8 Pro",
      "Pixel 8",
      "Pixel 7 Pro",
      "Pixel 7",
      "Pixel 6 Pro",
      "Pixel 6",
    ],
  },
];

export const phoneBrands = phoneBrandsAndModels.map((item) => item.brand);

export function getModelsByBrand(brand: string): string[] {
  const brandData = phoneBrandsAndModels.find((item) => item.brand === brand);
  return brandData?.models || [];
}

// دریافت مدل‌های سفارشی از API
export async function getCustomModelsByBrand(brand: string): Promise<string[]> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_BASE_URL}/api/phone-models/${encodeURIComponent(brand)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error loading custom models:', error);
    return [];
  }
}

// دریافت همه مدل‌ها (پیش‌فرض + سفارشی)
export async function getAllModelsByBrand(brand: string): Promise<string[]> {
  const defaultModels = getModelsByBrand(brand);
  const customModels = await getCustomModelsByBrand(brand);
  
  // ترکیب و حذف تکراری
  return [...new Set([...defaultModels, ...customModels])];
}

// اضافه کردن مدل جدید به دیتابیس
export async function addCustomModel(brand: string, model: string): Promise<void> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    await fetch(`${API_BASE_URL}/api/phone-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model }),
    });
  } catch (error) {
    console.error('Error saving custom model:', error);
    throw error;
  }
}

