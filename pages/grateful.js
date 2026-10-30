import { server } from "../lib/config";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import GratefulContent from "../components/pages/grateful";

export default function GratefulPage() {
  const { t } = useLocale();
  return (
    <>
      <Meta
        title={t("grateful")}
        description={t("gratefulText")}
        url={`${server}/grateful`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <GratefulContent />
    </>
  );
}

GratefulPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

// The phone header shows the page title (an interface string).
export async function getStaticProps() {
  return {
    props: {
      contentTitleKey: "grateful",
    },
  };
}
