import { isLanguageCode } from "../../../../../../lib/language";
import { bookHadithPath } from "../../../../../../lib/hadith";

// Old per-language URLs; the language is now a ?lang= parameter of the hadith page.
export default function HadithTranslationRedirect() {
  return null;
}

export async function getServerSideProps(context) {
  const { bookId, hadithNumber, lang } = context.params;
  const destination = bookHadithPath(bookId, hadithNumber);
  return {
    redirect: {
      destination: isLanguageCode(lang) ? `${destination}?lang=${lang.toLowerCase()}` : destination,
      permanent: true,
    },
  };
}
