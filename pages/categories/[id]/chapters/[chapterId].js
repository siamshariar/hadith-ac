// This route was never implemented (the page file was empty). Redirecting to the
// parent category page keeps the build from breaking until a real page is built here.
export default function CategoryChapterRedirect() {
  return null;
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  return {
    redirect: {
      destination: `/categories/${id}`,
      permanent: false,
    },
  };
}
