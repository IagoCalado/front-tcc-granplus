const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const matchesSearch = (fields, searchTerm) => {
  const normalizedTerm = normalizeSearchText(searchTerm);

  if (!normalizedTerm) return true;

  return fields.some((field) =>
    normalizeSearchText(field).includes(normalizedTerm),
  );
};

export { normalizeSearchText, matchesSearch };