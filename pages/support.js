import { server, shareImage } from "../lib/config";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import SupportContent from "../components/pages/support";

export default function SupportPage() {
  const { t } = useLocale();
  return (
    <>
      <Meta
        title={t("support")}
        description={t("supportText")}
        url={`${server}/support`}
        image={shareImage}
        type="website"
      />

      <SupportContent />
    </>
  );
}

SupportPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

// The phone header shows the page title (an interface string).
export async function getStaticProps() {
  return {
    props: {
      contentTitleKey: "support",
    },
  };
}
