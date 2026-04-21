import type { LangCode } from './worker-translations';

export async function translateText(text: string, targetLang: LangCode): Promise<string> {
  if (!text.trim()) return text;
  if (targetLang === 'en') return text;
  const trimmed = text.slice(0, 480);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };
  if (data.responseStatus && String(data.responseStatus) !== '200') {
    throw new Error(`Translate error ${data.responseStatus}`);
  }
  return data.responseData?.translatedText || text;
}
