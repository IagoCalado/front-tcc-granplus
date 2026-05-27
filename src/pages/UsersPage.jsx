import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import UserModal from "../components/common/UserModal";
import AlertDialog from "../components/common/AlertDialog";
import ConfirmDialog from "../components/common/ConfirmDialog";
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
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [passwordStatus, setPasswordStatus] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    targetUser: null,
  });
  const [saveConfirmState, setSaveConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    payload: null,
    targetId: null,
  });
  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);

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

  const handleChangePassword = () => {
    setPasswordConfirmOpen(true);
  };

  const handleConfirmChangePassword = async () => {
    try {
      setPasswordConfirmOpen(false);
      setPasswordStatus("Atualizando...");
      await updatePassword(token, user.user_id, {
        senhaAtual: passwords.current,
        novaSenha: passwords.new,
      });
      setPasswordStatus("Senha atualizada com sucesso!");
      setPasswords({ current: "", new: "" });
      setAlertState({
        open: true,
        title: "Senha atualizada",
        message: "Senha atualizada com sucesso!",
        tone: "success",
      });
    } catch (err) {
      setPasswordStatus("Erro: " + err.message);
    }
  };

  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userToDelete) => {
    setConfirmState({
      open: true,
      title: `Tem certeza que deseja excluir o usuário ${userToDelete.user_nome} ?`,
      // message: `Tem certeza que deseja excluir o usuário ${userToDelete.user_nome}?`,
      targetUser: userToDelete,
    });
  };

  const handleConfirmDelete = async () => {
    const userToDelete = confirmState.targetUser;
    if (!userToDelete) {
      setConfirmState({
        open: false,
        title: "",
        message: "",
        targetUser: null,
      });
      return;
    }

    setConfirmState((prev) => ({ ...prev, open: false }));
    try {
      await deleteUser(token, userToDelete.user_id);
      setAlertState({
        open: true,
        title: "Usuário excluído com sucesso !",
        // message: "Usuário excluído com sucesso !",
        tone: "success",
      });
      loadData();
    } catch (err) {
      setAlertState({
        open: true,
        title: "Erro ao excluir : " + err.message,
        // message: "Erro ao excluir usuário: " + err.message,
        tone: "error",
      });
    } finally {
      setConfirmState({
        open: false,
        title: "",
        message: "",
        targetUser: null,
      });
    }
  };

  const handleSaveUser = (formData, id) => {
    setSaveConfirmState({
      open: true,
      title: id ? "Deseja salvar as alterações deste usuário ?" : "Deseja criar este novo usuário ?",
      // message: id
      //   ? "Deseja salvar as alterações deste usuário ?"
      //   : "Deseja criar este novo usuário ?",
      payload: formData,
      targetId: id || null,
    });
  };

  const handleConfirmSaveUser = async () => {
    const payload = saveConfirmState.payload;
    if (!payload) {
      setSaveConfirmState({
        open: false,
        title: "",
        message: "",
        payload: null,
        targetId: null,
      });
      return;
    }

    try {
      const targetId = saveConfirmState.targetId;
      if (targetId) {
        await updateUser(token, targetId, payload);
        setAlertState({
          open: true,
          title: "Usuário atualizado com sucesso !",
          // message: "Usuario atualizado com sucesso!",
          tone: "success",
        });
      } else {
        await createUser(token, payload);
        setAlertState({
          open: true,
          title: "Usuário criado com sucesso !",
          // message: "Usuário criado com sucesso!",
          tone: "success",
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setAlertState({
        open: true,
        title: "Erro ao salvar usuário",
        message: "Erro ao salvar usuário: " + err.message,
        tone: "error",
      });
    } finally {
      setSaveConfirmState({
        open: false,
        title: "",
        message: "",
        payload: null,
        targetId: null,
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((row) =>
      matchesSearch(
        [row?.user_nome, row?.user_email, row?.user_nivel_acesso, row?.user_ativo],
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

  const resetAlert = () =>
    setAlertState({ open: false, title: "", message: "", tone: "info" });

  

  if (isAdmin) {
    const columns = [
      { key: "user_nome", label: "Usuário", sortable: true },
      { key: "user_email", label: "Email", sortable: true },
      {
        key: "user_nivel_acesso",
        label: "Nivel",
        sortable: true,
        sortAccessor: (row) => formatRole(row.user_nivel_acesso),
        render: (row) => formatRole(row.user_nivel_acesso),
      },
      {
        key: "user_ativo",
        label: "Status",
        sortable: true,
        sortType: "number",
        sortAccessor: (row) => (row.user_ativo ? 1 : 0),
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

        <AlertDialog
          isOpen={alertState.open}
          title={alertState.title}
          message={alertState.message}
          tone={alertState.tone}
          onClose={resetAlert}
        />

        <ConfirmDialog
          isOpen={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          tone="danger"
          confirmLabel="Excluir"
          onConfirm={handleConfirmDelete}
          onCancel={() =>
            setConfirmState({
              open: false,
              title: "",
              message: "",
              targetUser: null,
            })
          }
        />

        <ConfirmDialog
          isOpen={saveConfirmState.open}
          title={saveConfirmState.title}
          message={saveConfirmState.message}
          tone="warning"
          confirmLabel={saveConfirmState.targetId ? "Atualizar" : "Criar"}
          onConfirm={handleConfirmSaveUser}
          onCancel={() =>
            setSaveConfirmState({
              open: false,
              title: "",
              message: "",
              payload: null,
              targetId: null,
            })
          }
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
          <p>Email: {profile.user_email || "Nao informado"}</p>
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

      <ConfirmDialog
        isOpen={passwordConfirmOpen}
        title="Deseja atualizar sua senha agora ?"
        // message="Deseja atualizar sua senha agora ?"
        tone="warning"
        confirmLabel="Atualizar"
        onConfirm={handleConfirmChangePassword}
        onCancel={() => setPasswordConfirmOpen(false)}
      />
    </div>
  );
};

export default UsersPage;