/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
        pdt_estoque_minimo: product.pdt_estoque_minimo ?? '',
        pdt_ativo: product.pdt_ativo ?? 1,
        cat_id: product.cat_id || 1,
        unid_med_id: product.unid_med_id || 1,
      });  
    } else {
      setFormData({
        pdt_nome: '',
        pdt_codigo: '',
        pdt_descricao: '',
        pdt_estoque_minimo: '',
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
      ...formData,
    };
    onSave(submitData, product?.pdt_id);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', color: '#1f2937'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Nome do Produto</label>
            <input type="text" name="pdt_nome" value={formData.pdt_nome} onChange={handleChange} required placeholder="Ex: Ração GranPlus Adultos"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Código do Produto</label>
            <input type="text" name="pdt_codigo" value={formData.pdt_codigo} onChange={handleChange} required placeholder="Ex: GP-1025"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Descrição</label>
            <input type="text" name="pdt_descricao" value={formData.pdt_descricao} onChange={handleChange} placeholder="Descreva brevemente o produto"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '2px', fontSize: '14px', fontWeight: '500' }}>Estoque Mínimo</label>
            <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>Estoque Mínimo.</span>
            <input type="number" name="pdt_estoque_minimo" value={formData.pdt_estoque_minimo} onChange={handleChange} required placeholder="Ex: 5"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer'
            }}>Cancelar</button>
            <button type="submit" style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: '600'
            }}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}