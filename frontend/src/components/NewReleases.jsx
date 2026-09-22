import GameCarousel from "./GameCarousel";

const API_URL = import.meta.env.VITE_API_URL;

// Release date in the card's top-left tag (where other rows show the year).
const formatRelease = (item) =>
  item.released
    ? new Date(item.released).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

export default function NewReleases() {
  return (
    <GameCarousel
      url={`${API_URL}/api/new-releases`}
      title="New Releases"
      renderDateTag={formatRelease}
    />
  );
}
