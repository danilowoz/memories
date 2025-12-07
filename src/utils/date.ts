export function formatDate(date: string) {
  const fullDate = new Date(date);

  const month = fullDate.toLocaleDateString("en-US", {
    month: "short",
  });

  const year = fullDate.toLocaleDateString("en-US", {
    year: "numeric",
  });

  return `${month}, ${year}`;
}
