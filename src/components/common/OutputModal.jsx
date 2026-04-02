import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { getLocations, getProducts } from '../../services/api';

export default function OutputModal({ isOpen, onClose, onSave, token }) {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    pdt_id: '',
    loc_id: '',
    lcl_qtde: '',
    lcl_destino: '',
    lcl_tipo: '', // vai ser usado como Motivo
    lcl_justificativa: ''
  });

  useEffect(() => {
    if (isOpen && token) {
      getProducts(token).then(data => setProducts(data || [])).catch(() => {});
      getLocations(token).then(data => setLocations(Array.isArray(data) ? data : [])).catch(() => setLocations([]));
      
      setFormData({
        pdt_id: '',
        loc_id: '',
        lcl_qtde: '',
        lcl_destino: '',
        lcl_tipo: '', // Motivo
        lcl_justificativa: ''
      });
      setErrorMsg('');
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.pdt_id === formData.pdt_id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'lcl_qtde' || name === 'pdt_id' ? Number(value) : value
      };
      
      if (name === 'lcl_qtde' && selectedProduct) {
        if (Number(value) > selectedProduct.pdt_estoque_atual) {
          setErrorMsg(`Atenção: A quantidade excede o estoque atual (${selectedProduct.pdt_estoque_atual}).`);
        } else {
          setErrorMsg('');
        }
      }

      if (name === 'pdt_id' && newData.lcl_qtde) {
        const newProd = products.find(p => p.pdt_id === Number(value));
        if (newProd && newData.lcl_qtde > newProd.pdt_estoque_atual) {
          setErrorMsg(`Atenção: A quantidade excede o estoque atual (${newProd.pdt_estoque_atual}).`);
        } else {
          setErrorMsg('');
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.pdt_id) {
      setErrorMsg('Selecione um produto.');
      return;
    }

    if (!formData.loc_id) {
      setErrorMsg('Selecione a localização.');
      return;
    }

    if (!formData.lcl_qtde || formData.lcl_qtde <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    if (!formData.lcl_tipo.trim()) {
      setErrorMsg('Informe o motivo da saída.');
      return;
    }

    if (selectedProduct && formData.lcl_qtde > selectedProduct.pdt_estoque_atual) {
      setErrorMsg(`Erro: Não há estoque suficiente. O limite é ${selectedProduct.pdt_estoque_atual}.`);
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      if (error?.message?.includes('Estoque insuficiente')) {
        setErrorMsg(error.message);
        return;
      }
      setErrorMsg(error?.message || 'Erro ao registrar saída.');
    }
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
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Registrar Nova Saída</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Produto <span style={{fontSize: '12px', color: '#888', fontWeight: 'normal'}}>(Ex: Ração Magnus 15kg)</span>
            </label>
            <select name="pdt_id" value={formData.pdt_id} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Selecione o produto...</option>
              {products.map(p => (
                <option key={p.pdt_id} value={p.pdt_id}>
                  {p.pdt_nome} (Estoque: {p.pdt_estoque_atual})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Localização <span style={{fontSize: '12px', color: '#888', fontWeight: 'normal'}}>(Ex: Almoxarifado Central)</span>
            </label>
            <select name="loc_id" value={formData.loc_id} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Selecione a localização...</option>
              {locations.map((loc) => (
                <option key={loc.loc_id} value={loc.loc_id}>{loc.loc_nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Quantidade <span style={{fontSize: '12px', color: '#888', fontWeight: 'normal'}}>(Ex: 5, 10, 50)</span>
            </label>
            <input type="number" name="lcl_qtde" value={formData.lcl_qtde} onChange={handleChange} min="1" max={selectedProduct ? selectedProduct.pdt_estoque_atual : undefined} placeholder="Digite a quantidade a ser retirada..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', borderColor: errorMsg.includes('estoque') ? '#ef4444' : '#ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Motivo <span style={{fontSize: '12px', color: '#888', fontWeight: 'normal'}}>(Ex: Venda, Descarte por vencimento, Doação)</span>
            </label>
            <input type="text" name="lcl_tipo" value={formData.lcl_tipo} onChange={handleChange} placeholder="Digite o motivo da saída..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Destino <span style={{fontSize: '12px', color: '#888', fontWeight: 'normal'}}>(Ex: Cliente João, Loja 2, Setor Financeiro)</span>
            </label>
            <input type="text" name="lcl_destino" value={formData.lcl_destino} onChange={handleChange} placeholder="Digite o destino... (Opcional)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: '500'
            }}>Cancelar</button>
            <button type="submit" disabled={!!errorMsg && errorMsg.includes('Erro')} style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: !!errorMsg && errorMsg.includes('Erro') ? '#fca5a5' : '#eab308', color: '#fff', cursor: !!errorMsg && errorMsg.includes('Erro') ? 'not-allowed' : 'pointer', fontWeight: '600'
            }}>Confirmar Saída</button>
          </div>
        </form>
      </div>
    </div>
  );
}