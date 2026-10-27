import StoredList from "./StoredList";

export default function PinList({ controller }) {
  return <StoredList kind="pin" controller={controller} />;
}
