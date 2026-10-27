import { server } from "../lib/config";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import SupportContent from "../components/pages/support";

export default function SupportPage() {
  return (
    <>
      <Meta
        title="Support"
        description="Please mail us if you want to support. Any kind of support is highly appreciable. Email: deeniinfotech@gmail.com"
        url={`${server}/support`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <SupportContent />
    </>
  );
}

SupportPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  return {
    props: {
      contentTitle: "Support",
    },
  };
}
