import Grid from "@mui/material/Grid";
import Container from "../core/container";
import BookCard from "./book-card";
import styles from "./book-list.module.scss";

export default function BookList({ books, linkToBooksPage = false }) {
  return (
    <div className={styles.wrap}>
      <Container>
        <Grid container className={styles.gridContainer}>
          {books &&
            books.map((book) => (
              <Grid key={book.id} className={styles.gridItem}>
                <BookCard book={book} linkToBooksPage={linkToBooksPage} />
              </Grid>
            ))}
        </Grid>
      </Container>
    </div>
  );
}