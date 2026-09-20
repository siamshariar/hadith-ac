import { server } from "../../../lib/config";
import {
  getBookById,
  getChaptersByBook,
  ensureSerializable,
} from "../../../lib/fetch";
import Meta from "../../../components/core/meta";
import Layout from "../../../components/layouts/LayoutSecondary";
import BookContent from "../../../components/content/Book";

export default function Book({
  book,
  chapters,
  bookId
}) {
  const title = book ? (book.name_en || book.title || `Book ${bookId}`) : `Book ${bookId}`;
  const description = `${title}. Hadith collection with multiple translations.`;
  const url = `${server}/books/${bookId}`;

  return (
    <>
      <Meta
        title={title}
        description={description}
        url={url}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <BookContent
        book={book}
        chapters={chapters || []}
        bookId={bookId}
      />
    </>
  );
}

Book.getLayout = function getLayout(page) {
  const { book, chapters, bookId } = page.props;
  return (
    <Layout
      linkPattern="books"
      books={book ? [book] : []}
      selectedBookId={bookId ? parseInt(bookId) : null}
      chapters={chapters}
    >
      {page}
    </Layout>
  );
};

export async function getStaticProps(context) {
  const { bookId } = context.params;

  try {
    const [book, chapters] = await Promise.all([
      getBookById(bookId).catch(() => null),
      getChaptersByBook(bookId).catch(() => [])
    ]);

    return {
      props: {
        book: ensureSerializable(book),
        chapters: ensureSerializable(chapters),
        bookId: bookId,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps for book:', error);

    return {
      props: {
        book: null,
        chapters: [],
        bookId: bookId,
      },
      revalidate: 60,
    };
  }
}

export async function getStaticPaths() {
  // For now, don't pre-generate paths - use fallback
  return {
    paths: [],
    fallback: 'blocking',
  };
}