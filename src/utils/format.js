export const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return Number(value).toLocaleString("pt-BR");
};

export const formatRole = (role) => {
  if (!role) return "-";
  return role === "admin" ? "Admin" : "Usuário";
};
