import { server } from "../../../../lib/config";
import {
  getBooks,
  getChaptersByBook,
  getAllHadithsByChapter,
  ensureSerializable,
} from "../../../../lib/fetch";
import { useEffect, useState } from 'react';
import Meta from "../../../../components/core/meta";
import Layout from "../../../../components/layouts/LayoutSecondary";
import CategoryContent from "../../../../components/content/Category";

export default function Chapter({ 
  chapter, 
  hadiths, 
  book, 
  bookId, 
  chapterId, 
  chapters,
  initialHadiths
}) {
  const [apiHadiths, setApiHadiths] = useState(hadiths || initialHadiths || []);
  const [loading, setLoading] = useState(false);

  // Build page title with chapter number and name
  const getPageTitle = () => {
    if (!chapter) return `Chapter ${chapterId}`;
    
    const chapterNumber = chapter.id || chapter.chapter_number || chapter.number || chapter.chapter_id || chapterId;
    const chapterName = chapter.title || chapter.name_en || chapter.chapter_title || chapter.name || 'Revelation';
    
    return `Chapter ${chapterNumber} — ${chapterName}`;
  };

  // Build breadcrumb path for the chapter page
  const getBreadcrumbPath = () => {
    const path = [];
    
    if (book) {
      path.push({
        type: 'book',
        text: book.name_en || book.title || 'Book'
      });
    }
    
    if (chapter) {
      const chapterNumber = chapter.id || chapter.chapter_number || chapter.number || chapter.chapter_id || chapterId;
      const chapterName = chapter.title || chapter.name_en || chapter.chapter_title || chapter.name || 'Revelation';
      
      path.push({
        type: 'chapter',
        text: `Chapter ${chapterNumber} — ${chapterName}`
      });
    }
    
    return path;
  };

  const pageTitle = getPageTitle();
  const breadcrumbPath = getBreadcrumbPath();

  return (
    <>
      <Meta
        title={pageTitle}
        description={`${pageTitle}. Hadith application in Vietnamese.`}
        url={`${server}/books/${bookId}/chapters/${chapterId}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <CategoryContent 
        hadiths={apiHadiths} 
        category={chapter} 
        book={book} 
        bookId={bookId}
        breadcrumbPath={breadcrumbPath}
        pageTitle={pageTitle}
      />
    </>
  );
}

Chapter.getLayout = function getLayout(page) {
  const { book, chapters, chapterId } = page.props;
  return (
    <Layout
      linkPattern="books"
      books={book ? [book] : []}
      selectedBookId={book ? book.id : null}
      chapters={chapters}
      selectedChapterId={chapterId ? parseInt(chapterId) : null}
    >
      {page}
    </Layout>
  );
};

export async function getServerSideProps(context) {
  try {
    const bookId = context.params.bookId;
    const chapterId = context.params.chapterId;
    const bookNum = parseInt(bookId);
    const chapterNum = parseInt(chapterId);

    // Fetch data from API
    const [booksData, chapters] = await Promise.all([
      getBooks(),
      getChaptersByBook(bookId),
    ]);

    const books = booksData?.books || [];
    const chapter = chapters.find((c) => c.id == chapterNum) || chapters.find((c) => c.chapter_no == chapterNum);
    const book = books.find((b) => b.id == bookNum) || null;

    // Fetch hadiths using the chapter's real internal id, not the raw URL param
    // (which may be a chapter_no if that's what was linked to).
    const hadiths = chapter ? await getAllHadithsByChapter(bookId, chapter.id) : [];

    if (!book) {
      console.warn(`Book not found for bookId=${bookId}`);
    }

    // Ensure all data is serializable
    const serializableBook = book ? ensureSerializable(book) : null;
    const serializableChapter = chapter ? ensureSerializable(chapter) : null;
    const serializableHadiths = hadiths.map(h => ensureSerializable(h));
    const serializableChapters = chapters.map(c => ensureSerializable(c));

    return {
      props: {
        book: serializableBook,
        chapter: serializableChapter,
        hadiths: serializableHadiths,
        initialHadiths: serializableHadiths,
        chapters: serializableChapters,
        bookId: bookId,
        chapterId: chapterId,
        selectedCategoryId: null,
        backLink: `/books/${bookId}`,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        book: null,
        chapter: null,
        hadiths: [],
        initialHadiths: [],
        chapters: [],
        bookId: context.params.bookId,
        chapterId: context.params.chapterId,
        selectedCategoryId: null,
        backLink: `/books/${context.params.bookId}`,
      },
    };
  }
}