import { server } from "../lib/config";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import AboutContent from "../components/pages/about";

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <>
      <Meta
        title={t("about")}
        description={`${t("aboutApp")} ${t("siteTagline")}`}
        url={`${server}/about`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <AboutContent />
    </>
  );
}

AboutPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

// The phone header shows the page title (an interface string).
export async function getStaticProps() {
  return {
    props: {
      contentTitleKey: "about",
    },
  };
}
