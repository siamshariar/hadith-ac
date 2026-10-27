import { server } from "../lib/config";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import ContactContent from "../components/pages/contact";

export default function ContactPage() {
  return (
    <>
      <Meta
        title="Contact"
        description={`Hadith application in Vietnamese. For all inquiries, please email us. We'll get back to you as soon as we can insha'Allah.`}
        url={`${server}/contact`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <ContactContent />
    </>
  );
}

ContactPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  return {
    props: {
      contentTitle: "Contact",
    },
  };
}
