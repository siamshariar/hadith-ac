export default function handler(req, res) {
  try {
    // List of supported languages with metadata
    const languages = [
      { code: 'ar', name: 'Arabic', native: 'العربية', direction: 'rtl' },
      { code: 'en', name: 'English', native: 'English', direction: 'ltr' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা', direction: 'ltr' },
      { code: 'ur', name: 'Urdu', native: 'اردو', direction: 'rtl' },
      { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', direction: 'ltr' },
      { code: 'fr', name: 'French', native: 'Français', direction: 'ltr' },
      { code: 'tr', name: 'Turkish', native: 'Türkçe', direction: 'ltr' },
      { code: 'ru', name: 'Russian', native: 'Русский', direction: 'ltr' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்', direction: 'ltr' },
      { code: 'es', name: 'Spanish', native: 'Español', direction: 'ltr' },
      { code: 'pt', name: 'Portuguese', native: 'Português', direction: 'ltr' },
      { code: 'fa', name: 'Persian', native: 'فارسی', direction: 'rtl' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी', direction: 'ltr' },
      { code: 'de', name: 'German', native: 'Deutsch', direction: 'ltr' },
      { code: 'it', name: 'Italian', native: 'Italiano', direction: 'ltr' },
      { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', direction: 'ltr' },
      { code: 'bs', name: 'Bosnian', native: 'Bosanski', direction: 'ltr' },
      { code: 'zh', name: 'Chinese', native: '中文', direction: 'ltr' },
      { code: 'ja', name: 'Japanese', native: '日本語', direction: 'ltr' },
      { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', direction: 'ltr' },
      { code: 'tl', name: 'Tagalog', native: 'Tagalog', direction: 'ltr' },
      { code: 'si', name: 'Sinhalese', native: 'සිංහල', direction: 'ltr' },
      { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', direction: 'rtl' },
      { code: 'ha', name: 'Hausa', native: 'Hausa', direction: 'ltr' },
      { code: 'ku', name: 'Kurdish', native: 'کوردی', direction: 'rtl' },
      { code: 'sw', name: 'Swahili', native: 'Kiswahili', direction: 'ltr' }
    ];

    res.status(200).json({
      success: true,
      data: languages
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}