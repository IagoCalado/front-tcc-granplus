import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import UserModal from "../components/common/UserModal";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserById,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
} from "../services/api";
import { formatRole } from "../utils/format";
import { matchesSearch } from "../utils/search";

const UsersPage = () => {
  const { token, isAdmin, user } = useAuth();
  const { searchTerm = "", setSearchTerm } = useOutletContext() || {};
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [passwordStatus, setPasswordStatus] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        const data = await getUsers(token);
        setUsers(data?.usuarios || []);
      } else if (user?.user_id) {
        const data = await getUserById(token, user.user_id);
        setProfile(data);
      }
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token, user]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [loadData, token]);

  const handleChangePassword = async () => {
    try {
      setPasswordStatus("Atualizando...");
      await updatePassword(token, user.user_id, {
        senhaAtual: passwords.current,
        novaSenha: passwords.new,
      });
      setPasswordStatus("Senha atualizada com sucesso!");
      setPasswords({ current: "", new: "" });
    } catch (err) {
      setPasswordStatus("Erro: " + err.message);
    }
  };

  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userToDelete) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o usuário ${userToDelete.user_nome}?`,
      )
    ) {
      try {
        await deleteUser(token, userToDelete.user_id);
        alert("Usuário excluído com sucesso!");
        loadData();
      } catch (err) {
        alert("Erro ao excluir usuário: " + err.message);
      }
    }
  };

  const handleSaveUser = async (formData, id) => {
    try {
      if (id) {
        await updateUser(token, id, formData);
        alert("Usuário atualizado com sucesso!");
      } else {
        await createUser(token, formData);
        alert("Usuário criado com sucesso!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Erro ao salvar usuário: " + err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((row) =>
      matchesSearch(
        [row?.user_nome, row?.user_nivel_acesso, row?.user_ativo],
        searchTerm,
      ),
    );
  }, [users, searchTerm]);

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para acessar usuários"
        description="O módulo de usuários depende da autenticação da API."
      />
    );
  }

  if (loading && !users.length && !profile) {
    return <LoadingSpinner />;
  }

  if (error && !users.length && !profile) {
    return <EmptyState title="Nao foi possivel carregar" description={error} />;
  }

  

  if (isAdmin) {
    const columns = [
      { key: "user_nome", label: "Usuário" },
      {
        key: "user_nivel_acesso",
        label: "Nivel",
        render: (row) => formatRole(row.user_nivel_acesso),
      },
      {
        key: "user_ativo",
        label: "Status",
        render: (row) => (
          <StatusPill
            label={row.user_ativo ? "Ativo" : "Inativo"}
            tone={row.user_ativo ? "success" : "neutral"}
          />
        ),
      },
      {
        key: "actions",
        label: "Ações",
        render: (row) => (
          <div className="table-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => handleEditUser(row)}
            >
              Editar
            </button>
            {row.user_id !== user.user_id && (
              <button
                className="btn btn-ghost btn-danger"
                type="button"
                onClick={() => handleDeleteUser(row)}
              >
                Excluir
              </button>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="app-content">
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            // background: "var(--bg)",
            paddingTop: "4px",
            paddingBottom: "8px",
          }}
        >
          <SectionHeader
            title="Usuários"
            subtitle="Administração de acessos e permissões"
            onSearch={setSearchTerm}
            searchPlaceholder="Buscar por nome ou email..."
            actions={
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedUser(null);
                  setIsModalOpen(true);
                }}
              >
                Criar usuário
              </button>
            }
          />
        </div>
        <DataTable columns={columns} rows={filteredUsers} rowKey="user_id" />

        <UserModal
          isOpen={isModalOpen}
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Perfil indisponivel"
        description="Nao foi possivel carregar seu perfil no momento."
      />
    );
  }

  return (
    <div className="app-content">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--bg)",
          paddingTop: "4px",
          paddingBottom: "8px",
        }}
      >
        <SectionHeader
          title="Meu perfil"
          subtitle="Gerencie suas informacoes pessoais"
        />
      </div>
      <div className="stats-grid">
        <div className="card">
          <h3>Informacoes</h3>
          <p>Nome: {profile.user_nome}</p>
          <p>Nivel: {formatRole(profile.user_nivel_acesso)}</p>
          <p>Status: {profile.user_ativo ? "Ativo" : "Inativo"}</p>
          <p>Email: {user?.email || "Nao informado"}</p>
        </div>
        <div className="card">
          <h3>Mudar senha</h3>
          <div className="input-field">
            <label>Senha atual</label>
            <input
              type="password"
              placeholder="********"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
            />
          </div>
          <div className="input-field">
            <label>Nova senha</label>
            <input
              type="password"
              placeholder="********"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
            />
          </div>
          <button
            className="btn btn-outline"
            onClick={handleChangePassword}
            disabled={!passwords.current || !passwords.new}
          >
            Atualizar senha
          </button>
          {passwordStatus && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "14px",
                color: passwordStatus.startsWith("Erro") ? "red" : "green",
              }}
            >
              {passwordStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;