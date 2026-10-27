import { server } from "../lib/config";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import PrivacyPolicyContent from "../components/pages/privacy-policy";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Meta
        title="Privacy Policy"
        description="Hadith application in Vietnamese"
        url={`${server}/privacy-policy`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <PrivacyPolicyContent />
    </>
  );
}

PrivacyPolicyPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  return {
    props: {
      contentTitle: "Privacy Policy",
    },
  };
}
