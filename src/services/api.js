const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Função base para realizar requisições à API
const request = async (path, { token, method = "GET", body } = {}) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.detalhe ||
      data?.erro ||
      data?.error ||
      data?.message ||
      "Erro ao buscar dados";
    throw new Error(message);
  }

  return data;
};

// Autenticação
export const login = ({ email, password }) =>
  request("/usuarios/login", {
    method: "POST",
    body: {
      user_email: email,
      password,
      user_senha: password,
    },
  });

// Recuperação de senha
export const verifyUserForReset = ({ user_email }) =>
  request("/usuarios/verificar-usuario", {
    method: "POST",
    body: { user_email },
  });

export const sendResetPin = ({ user_email }) =>
  request("/usuarios/enviar-pin", {
    method: "POST",
    body: { user_email },
  });

export const resetPasswordWithPin = ({ user_email, pin, novaSenha }) =>
  request("/usuarios/redefinir-senha", {
    method: "POST",
    body: { user_email, pin, novaSenha },
  });

// Produtos
export const getProducts = (token, { includeInactive = false } = {}) => {
  const query = includeInactive ? "?includeInactive=1" : "";
  return request(`/produtos${query}`, { token });
};
export const createProduct = (token, payload) =>
  request("/produtos", { token, method: "POST", body: payload });
export const updateProduct = (token, id, payload) =>
  request(`/produtos/${id}`, { token, method: "PUT", body: payload });
export const deleteProduct = (token, id) =>
  request(`/produtos/${id}`, { token, method: "DELETE" });
export const activateProduct = (token, id) =>
  request(`/produtos/${id}/activate`, { token, method: "PATCH" });

export const getUnits = (token) => request("/unidademedidas", { token });

// Estoque
export const getStock = (token) => request("/estoque", { token });
export const getLocations = async (token) => {
  try {
    return await request("/localizacoes", { token });
  } catch {
    return request("/localizacoes/localizacoes", { token });
  }
};
export const getAllLocations = async (token) => {
  try {
    return await request("/localizacoes/all", { token });
  } catch {
    return request("/localizacoes/localizacoes/all", { token });
  }
};
export const createLocation = (token, payload) =>
  request("/localizacoes", { token, method: "POST", body: payload });
export const deleteLocation = (token, id) =>
  request(`/localizacoes/${id}`, { token, method: "DELETE" });
export const activateLocation = (token, id) =>
  request(`/localizacoes/${id}/activate`, { token, method: "PATCH" });

// Usuários
export const getUsers = (token) => request("/usuarios", { token });
export const getUserById = (token, id) => request(`/usuarios/${id}`, { token });
export const createUser = (token, payload) =>
  request(`/usuarios`, { token, method: "POST", body: payload });
export const updateUser = (token, id, payload) =>
  request(`/usuarios/${id}`, { token, method: "PUT", body: payload });
export const deleteUser = (token, id) =>
  request(`/usuarios/${id}`, { token, method: "DELETE" });
export const updatePassword = (token, id, payload) =>
  request(`/usuarios/${id}/senha`, { token, method: "PUT", body: payload });

// Entradas e Saídas
export const getInputs = (token) => request("/entradas", { token });
export const createInput = (token, payload) =>
  request("/entradas", { token, method: "POST", body: payload });
export const updateInput = (token, id, payload) =>
  request(`/entradas/${id}`, { token, method: "PUT", body: payload });
export const deleteInput = (token, id) =>
  request(`/entradas/${id}`, { token, method: "DELETE" });

export const getOutputs = (token) => request("/saidas", { token });
export const createOutput = (token, payload) =>
  request("/saidas", { token, method: "POST", body: payload });
export const getOutputAvailableLots = (token, pdtId) =>
  request(`/saidas/lotes-disponiveis/${pdtId}`, { token });

// Fornecedores
export const getSuppliers = (token) => request("/fornecedores", { token });
export const createSupplier = (token, payload) =>
  request("/fornecedores", { token, method: "POST", body: payload });
export const updateSupplier = (token, id, payload) =>
  request(`/fornecedores/${id}`, { token, method: "PUT", body: payload });
export const deleteSupplier = (token, id) =>
  request(`/fornecedores/${id}`, { token, method: "DELETE" });

// Relatórios e Auditoria
export const getMostMovedProducts = (token) =>
  request("/relatorios/produtos-mais-movimentados", { token });

export const getMinimumStock = (token) =>
  request("/relatorios/estoque-minimo", { token });

export const getTopSuppliersBySpend = (token) =>
  request("/relatorios/fornecedores-top", { token });

export const getAuditReports = (token, period) =>
  request(`/relatorios/auditoria?period=${period}`, { token });

export const getAuditReportsByDate = (token, startDate, endDate) =>
  request(`/relatorios/auditoria?startDate=${startDate}&endDate=${endDate}`, {
    token,
  });

export const getRelatorioDinamico = (token, tipo, startDate, endDate) =>
  request(
    `/relatorios/dinamico?tipo=${tipo}&startDate=${startDate}&endDate=${endDate}`,
    { token },
  );

export const getDashboardResume = (token) =>
  request("/dashboard/resumo", { token });
