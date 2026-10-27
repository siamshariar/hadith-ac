import { server } from "../lib/config";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import DeeniinfotechContent from "../components/pages/deeniinfotech";

export default function DeeniInfoTech() {
  return (
    <>
      <Meta
        title="Deeni Info Tech"
        description={`Deeni Info Tech : A non-profitable software development organization to spread Dawah all over the world`}
        url={`${server}/deeniinfotech`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <DeeniinfotechContent />
    </>
  );
}

DeeniInfoTech.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  return {
    props: {
      contentTitle: "Deeni Info Tech",
    },
  };
}
