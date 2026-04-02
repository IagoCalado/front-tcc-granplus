import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSuppliers, getProducts } from '../../services/api';

export default function InputModal({ isOpen, onClose, onSave, token, inputData }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    loc_id: 1, // Defaulting to Localização Central for now unless you have a dropdown
    fncd_id: '',
    ent_data_compra: '',
    ent_valor_compra: '',
    produtos: [{ pdt_id: '', quantidade: '', lote: '' }]
  });

  const getLocalISODate = (dateInput) => {
    // Se houver uma data do banco, usa ela; senão, usa a data atual
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';
    
    // Subtrai o fuso horário (ex: -3 horas do Brasil viram +3 no UTC)
    // Isso garante que o '.toISOString()' imprima o seu horário local exato corrigido!
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 16);
  };

  useEffect(() => {
    if (isOpen && token) {
      // Carrega Fornecedores e Produtos para usar nos Selects (Combo box)
      getSuppliers(token).then(data => setSuppliers(data || [])).catch(() => {});
      getProducts(token).then(data => setProducts(data || [])).catch(() => {});
      
      if (inputData) {
        // Modo de edição: preenche os campos com os dados existentes
        const rawDate = inputData.ent_data_compra || inputData.ent_data || '';
        const ISODate = rawDate ? getLocalISODate(rawDate) : '';
        
        setFormData({
          loc_id: inputData.loc_id || 1,
          fncd_id: inputData.fncd_id || '',
          ent_data_compra: ISODate,
          ent_valor_compra: inputData.ent_valor_compra || '',
          produtos: [
            { 
              pdt_id: inputData.pdt_id || '', 
              quantidade: inputData.ent_quantidade || '', 
              lote: inputData.lote || '' 
            }
          ]
        });
      } else {
        // Reseta os dados ao abrir o Modal Novo
        setFormData({
          loc_id: 1,
          fncd_id: '',
          ent_data_compra: getLocalISODate(), // Preenche data e hora atual no fuso local
          ent_valor_compra: '',
          produtos: [{ pdt_id: '', quantidade: '', lote: '' }]
        });
      }
    }
  }, [isOpen, token, inputData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fncd_id' || name === 'ent_valor_compra' ? Number(value) : value
    }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProdutos = [...formData.produtos];
    newProdutos[index][name] = name === 'pdt_id' || name === 'quantidade' ? Number(value) : value;
    setFormData({ ...formData, produtos: newProdutos });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      produtos: [...formData.produtos, { pdt_id: '', quantidade: '', lote: '' }]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if(!formData.fncd_id || formData.produtos.some(p => !p.pdt_id || !p.quantidade)) {
      alert("Preencha todos os campos do fornecedor, produto e quantidade.");
      return;
    }
    
    // Convert data compra to MySql DateTime format YYYY-MM-DD HH:MM:SS format
    const formattedData = {
      ...formData,
      ent_data_compra: formData.ent_data_compra.replace("T", " ") + ":00",
      produtos: formData.produtos.map(p => ({
        ...p,
        // Garante que o lote seja enviado como inteiro nulo se ficar vazio, para não quebrar a tipagem INT do banco
        lote: p.lote === '' ? null : Number(p.lote) 
      }))
    };

    onSave(formattedData);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', color: '#1f2937'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Nova Entrada de Produto</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Fornecedor</label>
              <select name="fncd_id" value={formData.fncd_id} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="">Selecione...</option>
                {suppliers.map(sup => (
                  <option key={sup.fncd_id} value={sup.fncd_id}>{sup.fncd_nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Data / Hora da Compra</label>
              <input type="datetime-local" name="ent_data_compra" value={formData.ent_data_compra} onChange={handleChange} required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          </div>
          
          <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Valor Total da Compra (R$)</label>
              <input type="number" step="0.01" name="ent_valor_compra" value={formData.ent_valor_compra} onChange={handleChange} required placeholder="Ex: 1500.50"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Itens da Entrada</h3>
            
            {formData.produtos.map((prod, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <select name="pdt_id" value={prod.pdt_id} onChange={(e) => handleProductChange(index, e)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="">Produto...</option>
                  {products.map(p => (
                    <option key={p.pdt_id} value={p.pdt_id}>{p.pdt_nome}</option>
                  ))}
                </select>
                <input type="number" name="quantidade" value={prod.quantidade} onChange={(e) => handleProductChange(index, e)} required placeholder="Qtd"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <input type="text" name="lote" value={prod.lote} onChange={(e) => handleProductChange(index, e)} placeholder="Lote (Opcional)"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
            ))}
            
            <button type="button" onClick={addProductRow} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '0', marginTop: '5px' }}>
              + Adicionar mais um produto
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer'
            }}>Cancelar</button>
            <button type="submit" style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '600'
            }}>Registrar Entrada</button>
          </div>
        </form>
      </div>
    </div>
  );
}