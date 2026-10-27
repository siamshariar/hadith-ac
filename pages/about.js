import { server } from "../lib/config";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import AboutContent from "../components/pages/about";

export default function AboutPage() {
  return (
    <>
      <Meta
        title="About"
        description="Hadith application in Vietnamese"
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

export async function getStaticProps() {
  return {
    props: {
      contentTitle: "About",
    },
  };
}
