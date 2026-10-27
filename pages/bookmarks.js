import { useRouter } from "next/router";
import { server } from "../lib/config";
import { loadPage } from "../lib/api";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutSecondary";
import BookmarkContent from "../components/bookmark/page";
import BookmarkMobile from "../components/mobile/Storage";

// /bookmarks?key={folder}: one bookmark folder. Without a key: the saved
// lists (bookmarks, pins, last read) as tabs.
export default function Bookmark() {
  const router = useRouter();
  const key = typeof router.query.key === "string" ? router.query.key : null;

  return (
    <>
      <Meta
        title="Bookmarks"
        description="Bookmarks. Hadith application in Vietnamese."
        url={`${server}/bookmarks`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />
      {key ? <BookmarkContent folderKey={key} /> : <BookmarkMobile />}
    </>
  );
}

Bookmark.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

// Server-rendered only to know the reader's language; the bookmarks
// themselves live in this browser's localStorage.
export async function getServerSideProps(context) {
  return loadPage(context, async () => ({ props: { backLink: "/" } }));
}
