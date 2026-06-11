/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

const categoriaMap = {
  1: 'Higiene e limpeza',
  2: 'Manutenção e peças',
  3: 'Escritório',
  4: 'informatica',
  5: 'EPI',
  6: 'Material eletrico',
  7: 'Insumos',
};

const categoryOptions = Object.entries(categoriaMap).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const unitOptions = [
  { value: 1, label: 'Unidade' },
  { value: 2, label: 'Caixa' },
  { value: 3, label: 'Quilo' },
  { value: 4, label: 'Litro' },
];

export default function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    pdt_nome: '',
    pdt_codigo: '',
    pdt_descricao: '',
    pdt_estoque_minimo: '',
    pdt_ativo: 1,
    cat_id: 1,
    unid_med_id: 1,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        pdt_nome: product.pdt_nome || '',
        pdt_codigo: product.pdt_codigo || '',
        pdt_descricao: product.pdt_descricao || '',
        pdt_estoque_minimo: product.pdt_estoque_minimo ?? 0,
        pdt_ativo: product.pdt_ativo ?? 1,
        cat_id: product.cat_id || 1,
        unid_med_id: product.unid_med_id || 1,
      });  
    } else {
      setFormData({
        pdt_nome: '',
        pdt_codigo: '',
        pdt_descricao: '',
        pdt_estoque_minimo: 0,
        pdt_ativo: 1,
        cat_id: 1,
        unid_med_id: 1,
      });     
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'pdt_estoque_minimo' || name === 'cat_id' || name === 'unid_med_id') && value !== '' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      pdt_nome: formData.pdt_nome?.trim() || '',
      pdt_codigo: formData.pdt_codigo?.trim() || '',
      pdt_descricao: formData.pdt_descricao?.trim() || '',
      pdt_estoque_minimo: Number(formData.pdt_estoque_minimo) || 0,
      pdt_ativo: Number(formData.pdt_ativo) || 1,
      cat_id: Number(formData.cat_id) || 1,
      unid_med_id: Number(formData.unid_med_id) || 1,
    };
    onSave(submitData, product?.pdt_id);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{product ? 'Editar Produto' : 'Novo Produto'}</h3>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Nome do Produto</label>
            <input type="text" name="pdt_nome" value={formData.pdt_nome} onChange={handleChange} required placeholder="Ex: Ração GranPlus Adultos" />
          </div>
          <div className="input-field">
            <label>Código do Produto</label>
            <input type="text" name="pdt_codigo" value={formData.pdt_codigo} onChange={handleChange} required placeholder="Ex: GP-1025" />
          </div>
          <div className="input-field">
            <label>Descrição</label>
            <input type="text" name="pdt_descricao" value={formData.pdt_descricao} onChange={handleChange} placeholder="Descreva brevemente o produto" />
          </div>
          <div className="input-field">
            <label>Estoque Mínimo</label>
            <input type="number" name="pdt_estoque_minimo" value={formData.pdt_estoque_minimo} onChange={handleChange} required placeholder="Ex: 5" />
          </div>
          <div className="input-field">
            <label>Categoria</label>
            <select name="cat_id" value={formData.cat_id} onChange={handleChange} required>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-field">
            <label>Unidade de Medida</label>
            <select name="unid_med_id" value={formData.unid_med_id} onChange={handleChange} required>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}