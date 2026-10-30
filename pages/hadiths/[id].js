import { getHadith } from "../../lib/api";
import HadithPage, { hadithLayout, loadHadithPage } from "../../components/hadith/HadithPage";

export default function Hadith(props) {
  return <HadithPage {...props} />;
}

Hadith.getLayout = hadithLayout;

export async function getServerSideProps(context) {
  const { id } = context.params;
  if (!/^\d+$/.test(String(id))) return { notFound: true };
  return loadHadithPage(context, (lang, { translations }) => getHadith(id, lang, { translations }));
}
