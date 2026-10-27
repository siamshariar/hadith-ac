import { getBookHadith } from "../../../../lib/api";
import HadithPage, { hadithLayout, loadHadithPage } from "../../../../components/hadith/HadithPage";

// A hadith by the number people cite (`referenceNumber`), e.g.
// /books/sahih-muslim/hadiths/8 (the API also accepts 8a or 8.01).
export default function BookHadith(props) {
  return <HadithPage {...props} />;
}

BookHadith.getLayout = hadithLayout;

export async function getServerSideProps(context) {
  const { bookId, hadithNumber } = context.params;
  return loadHadithPage(context, (lang) => getBookHadith(bookId, hadithNumber, lang));
}
