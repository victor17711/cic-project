import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ro' | 'en' | 'ru';

interface Translations {
  [key: string]: {
    ro: string;
    en: string;
    ru: string;
  };
}

// All app translations
export const translations: Translations = {
  // Welcome screen
  welcomeTitle: {
    ro: 'Bine ați venit!',
    en: 'Welcome!',
    ru: 'Добро пожаловать!',
  },
  welcomeSubtitle: {
    ro: 'Selectați limba preferată',
    en: 'Select your preferred language',
    ru: 'Выберите предпочитаемый язык',
  },
  continueButton: {
    ro: 'Continuă',
    en: 'Continue',
    ru: 'Продолжить',
  },
  // Auth
  login: {
    ro: 'Autentificare',
    en: 'Login',
    ru: 'Войти',
  },
  register: {
    ro: 'Înregistrare',
    en: 'Register',
    ru: 'Регистрация',
  },
  email: {
    ro: 'Email',
    en: 'Email',
    ru: 'Эл. почта',
  },
  password: {
    ro: 'Parola',
    en: 'Password',
    ru: 'Пароль',
  },
  confirmPassword: {
    ro: 'Confirmă parola',
    en: 'Confirm password',
    ru: 'Подтвердите пароль',
  },
  name: {
    ro: 'Nume complet',
    en: 'Full name',
    ru: 'Полное имя',
  },
  phone: {
    ro: 'Telefon',
    en: 'Phone',
    ru: 'Телефон',
  },
  noAccount: {
    ro: 'Nu ai cont?',
    en: "Don't have an account?",
    ru: 'Нет аккаунта?',
  },
  haveAccount: {
    ro: 'Ai deja cont?',
    en: 'Already have an account?',
    ru: 'Уже есть аккаунт?',
  },
  registerNow: {
    ro: 'Înregistrează-te',
    en: 'Register now',
    ru: 'Зарегистрироваться',
  },
  loginNow: {
    ro: 'Autentifică-te',
    en: 'Login now',
    ru: 'Войти',
  },
  createAccount: {
    ro: 'Creează cont',
    en: 'Create account',
    ru: 'Создать аккаунт',
  },
  // Navigation
  home: {
    ro: 'Acasă',
    en: 'Home',
    ru: 'Главная',
  },
  services: {
    ro: 'Servicii',
    en: 'Services',
    ru: 'Услуги',
  },
  assistant: {
    ro: 'Asistent',
    en: 'Assistant',
    ru: 'Ассистент',
  },
  consultation: {
    ro: 'Consultație',
    en: 'Consultation',
    ru: 'Консультация',
  },
  account: {
    ro: 'Cont',
    en: 'Account',
    ru: 'Аккаунт',
  },
  // Home page
  goodDay: {
    ro: 'Bună ziua,',
    en: 'Good day,',
    ru: 'Добрый день,',
  },
  heroTitle: {
    ro: 'Zâmbetul tău,\nprioritarea noastră',
    en: 'Your smile,\nour priority',
    ru: 'Ваша улыбка,\nнаш приоритет',
  },
  heroSubtitle: {
    ro: 'Servicii stomatologice de calitate în Chișinău',
    en: 'Quality dental services in Chisinau',
    ru: 'Качественные стоматологические услуги в Кишинёве',
  },
  requestConsultation: {
    ro: 'Solicită Consultație',
    en: 'Request Consultation',
    ru: 'Запросить консультацию',
  },
  ourServices: {
    ro: 'Serviciile Noastre',
    en: 'Our Services',
    ru: 'Наши услуги',
  },
  seeAll: {
    ro: 'Vezi toate',
    en: 'See all',
    ru: 'Смотреть все',
  },
  medicalTeam: {
    ro: 'Echipa Medicală',
    en: 'Medical Team',
    ru: 'Медицинская команда',
  },
  contactUs: {
    ro: 'Contactează-ne',
    en: 'Contact Us',
    ru: 'Связаться с нами',
  },
  history: {
    ro: 'Istoric',
    en: 'History',
    ru: 'История',
  },
  aiAssistant: {
    ro: 'Asistent AI',
    en: 'AI Assistant',
    ru: 'AI Ассистент',
  },
  // Profile
  profile: {
    ro: 'Profil',
    en: 'Profile',
    ru: 'Профиль',
  },
  editProfile: {
    ro: 'Editează profilul',
    en: 'Edit profile',
    ru: 'Редактировать профиль',
  },
  notifications: {
    ro: 'Notificări',
    en: 'Notifications',
    ru: 'Уведомления',
  },
  myConsultations: {
    ro: 'Consultațiile mele',
    en: 'My consultations',
    ru: 'Мои консультации',
  },
  language: {
    ro: 'Limba',
    en: 'Language',
    ru: 'Язык',
  },
  logout: {
    ro: 'Deconectare',
    en: 'Logout',
    ru: 'Выйти',
  },
  save: {
    ro: 'Salvează',
    en: 'Save',
    ru: 'Сохранить',
  },
  cancel: {
    ro: 'Anulează',
    en: 'Cancel',
    ru: 'Отмена',
  },
  // Consultation form
  step: {
    ro: 'Pasul',
    en: 'Step',
    ru: 'Шаг',
  },
  of: {
    ro: 'din',
    en: 'of',
    ru: 'из',
  },
  contactInfo: {
    ro: 'Date de contact',
    en: 'Contact information',
    ru: 'Контактная информация',
  },
  selectService: {
    ro: 'Selectează serviciul',
    en: 'Select service',
    ru: 'Выберите услугу',
  },
  additionalInfo: {
    ro: 'Informații suplimentare',
    en: 'Additional information',
    ru: 'Дополнительная информация',
  },
  continueBtn: {
    ro: 'Continuă',
    en: 'Continue',
    ru: 'Продолжить',
  },
  back: {
    ro: 'Înapoi',
    en: 'Back',
    ru: 'Назад',
  },
  submit: {
    ro: 'Trimite cererea',
    en: 'Submit request',
    ru: 'Отправить запрос',
  },
  // Assistant
  assistantTitle: {
    ro: 'Asistent CIC',
    en: 'CIC Assistant',
    ru: 'Ассистент CIC',
  },
  assistantSubtitle: {
    ro: 'Consultant dental virtual',
    en: 'Virtual dental consultant',
    ru: 'Виртуальный стоматолог',
  },
  typeQuestion: {
    ro: 'Scrie întrebarea ta...',
    en: 'Type your question...',
    ru: 'Напишите ваш вопрос...',
  },
  suggestedQuestions: {
    ro: 'Întrebări frecvente',
    en: 'Frequently asked questions',
    ru: 'Часто задаваемые вопросы',
  },
  // Languages
  romanian: {
    ro: 'Română',
    en: 'Romanian',
    ru: 'Румынский',
  },
  english: {
    ro: 'Engleză',
    en: 'English',
    ru: 'Английский',
  },
  russian: {
    ro: 'Rusă',
    en: 'Russian',
    ru: 'Русский',
  },
  // Settings
  settings: {
    ro: 'Setări',
    en: 'Settings',
    ru: 'Настройки',
  },
  changeLanguage: {
    ro: 'Schimbă limba',
    en: 'Change language',
    ru: 'Изменить язык',
  },
  selectLanguage: {
    ro: 'Selectează limba',
    en: 'Select language',
    ru: 'Выберите язык',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isFirstLaunch: boolean;
  setFirstLaunchComplete: () => void;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore errors
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('ro');
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const storedLanguage = await storage.getItem('language');
      const hasLaunched = await storage.getItem('hasLaunched');
      
      if (storedLanguage) {
        setLanguageState(storedLanguage as Language);
      }
      
      if (hasLaunched === 'true') {
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.log('Error loading language settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await storage.setItem('language', lang);
  };

  const setFirstLaunchComplete = async () => {
    setIsFirstLaunch(false);
    await storage.setItem('hasLaunched', 'true');
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isFirstLaunch,
        setFirstLaunchComplete,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
