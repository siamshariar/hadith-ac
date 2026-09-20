import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { server } from "../../lib/config";
import {
  getBooks,
  getChaptersByBook,
  getHadithsByChapter,
  getAllCategories,
  getAllCategoriesTree,
  getHadithDetailsById,
  ensureSerializable,
} from "../../lib/fetch";
import Meta from "../../components/core/meta";
import HadithContext from "../../contexts/HadithContext";

const HadithContent = dynamic(() => import('../../components/content/Hadith'), { ssr: false });
const HadithList = dynamic(() => import('../../components/content/HadithList'), { ssr: false });
const LayoutDynamic = dynamic(() => import('../../components/layouts/LayoutSecondary'), { ssr: false });

export default function Book({ book, hadiths, chapters, bookId, categoryList, categoryTree, books, selectedBookId, selectedChapterId }) {
  const router = useRouter();
  const slug = router.query.slug || [];

  // Redirect to first chapter if only book ID is provided
  useEffect(() => {
    if (slug.length === 1 && selectedChapterId) {
      router.push(`/books/${bookId}/chapters/${selectedChapterId}`);
    }
  }, [slug, selectedChapterId, bookId, router]);

  return (
    <>
      <Meta
        title={`${book ? book.title || book.name_en || book.name_ar : 'Book'} - ${selectedChapterId ? `Chapter ${selectedChapterId}` : ''}`}
        description={`Hadith from ${book ? book.title || book.name_en || book.name_ar : 'Book'}. Hadith application in Vietnamese.`}
        url={`${server}/books/${bookId}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <HadithList hadiths={hadiths} bookId={bookId} />
    </>
  );
}

Book.getLayout = function getLayout(page) {
  return (
    <LayoutDynamic 
      linkPattern="books"
      chapters={page.props.chapters}
      selectedChapterId={page.props.selectedChapterId}
    >
      {page}
    </LayoutDynamic>
  );
};

export async function getStaticProps(context) {
  const slug = context.params.slug;
  if (!slug || slug.length === 0) {
    return { notFound: true };
  }
  const bookId = parseInt(slug[0]);
  let chapterNumber = null;
  if (slug.length >= 2 && slug[1] === 'chapters') {
    chapterNumber = parseInt(slug[2]);
  }
  
  let hadiths = [];
  let chapters = [];
  let book = null;
  let selectedChapter = null;
  let categoryList = [];
  let categoryTree = [];
  let books = [];
  
  try {
    const booksData = await getBooks();
    books = booksData?.books || [];
    book = books.find(b => b.id === bookId) || null;
  } catch (error) {
    console.warn('Failed to fetch books:', error);
  }

  try {
    categoryList = await getAllCategories() || [];
    categoryTree = await getAllCategoriesTree() || [];
  } catch (error) {
    console.warn('Failed to fetch categories:', error);
  }
  
  try {
    chapters = await getChaptersByBook(bookId) || [];
  } catch (error) {
    console.warn(`Failed to fetch chapters for book ${bookId}:`, error);
  }

  if (chapterNumber) {
    selectedChapter = chapters.find(c => c.id === chapterNumber) || chapters.find(c => c.chapter_number === chapterNumber);
    if (selectedChapter) {
      try {
        hadiths = await getHadithsByChapter(bookId, selectedChapter.id) || [];
      } catch (error) {
        console.warn(`Failed to fetch hadiths for chapter ${chapterNumber}:`, error);
      }
    }
  } else if (chapters.length > 0) {
    // Default to first chapter
    selectedChapter = chapters[0];
    try {
      hadiths = await getHadithsByChapter(bookId, selectedChapter.id) || [];
    } catch (error) {
      console.warn(`Failed to fetch hadiths for first chapter:`, error);
    }
  }

  // Allow empty data - don't return notFound for missing data
  return {
    props: ensureSerializable({
      bookId: bookId,
      book: book,
      hadiths: hadiths,
      chapters: chapters,
      selectedBookId: bookId,
      selectedChapterId: selectedChapter ? selectedChapter.id : null,
      books: books,
      categoryList: categoryList,
      categoryTree: categoryTree,
      contentTitle: book ? (book.name_en || book.name_ar || book.title) : `Book ${bookId}`,
      backLink: "/books",
      key: bookId,
    }),
    revalidate: 60, // Revalidate every 60 seconds
  };
}

export async function getStaticPaths() {
  let paths = [];
  try {
    const { books } = await getBooks();
    if (Array.isArray(books) && books.length > 0) {
      for (const book of books) {
        if (book && book.id) {
          // Fetch chapters for this book
          try {
            const chapters = await getChaptersByBook(book.id);
            if (chapters && chapters.length > 0) {
              for (const chapter of chapters.slice(0, 5)) { // Limit to first 5 chapters
                // Path for chapter page
                paths.push({ params: { slug: [String(book.id), 'chapters', String(chapter.id)] } });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch chapters for book ${book.id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to generate static paths for books:', error);
  }

  return {
    paths: paths,
    fallback: true,
  };
}
