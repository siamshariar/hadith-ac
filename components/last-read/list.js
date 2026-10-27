import StoredList from "../pin/StoredList";

export default function LastReadList({ controller }) {
  return <StoredList kind="lastRead" controller={controller} />;
}
