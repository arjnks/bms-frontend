import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';
import { customersApi } from '../../api/customers';
import { billsApi } from '../../api/bills';

export default function BillUpload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('upload'); // 'upload' | 'manual'

  // Customer dropdown
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Bill fields
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [gstTotal, setGstTotal] = useState('');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);

  // Manual line items
  const [lineItems, setLineItems] = useState([
    { product: '', hsn: '', qty: '', unit: 'Nos', rate: '', gst: '12' },
  ]);

  // Load customers for dropdown
  useEffect(() => {
    customersApi.list()
      .then(res => setCustomers(res.data || res))
      .catch(err => showToast('Failed to load customers', 'error'))
      .finally(() => setCustomersLoading(false));
  }, []);

  const handleCustomerChange = (id) => {
    setCustomerId(id);
    setSelectedCustomer(customers.find(c => String(c.id) === String(id)) ?? null);
  };

  const addLine    = () => setLineItems(ls => [...ls, { product: '', hsn: '', qty: '', unit: 'Nos', rate: '', gst: '12' }]);
  const removeLine = (i) => setLineItems(ls => ls.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLineItems(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const lineTotal  = (l) => { const base = parseFloat(l.qty || 0) * parseFloat(l.rate || 0); return base + base * parseFloat(l.gst || 0) / 100; };
  const grandTotal = lineItems.reduce((s, l) => s + lineTotal(l), 0);

  const computedSubtotal = lineItems.reduce((s, l) => s + parseFloat(l.qty || 0) * parseFloat(l.rate || 0), 0);
  const computedGst      = lineItems.reduce((s, l) => {
    const base = parseFloat(l.qty || 0) * parseFloat(l.rate || 0);
    return s + base * parseFloat(l.gst || 0) / 100;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) { showToast('Please select a customer.', 'warn'); return; }
    if (!invoiceNo || !billDate || !dueDate) { showToast('Fill in all required fields.', 'warn'); return; }
    if (mode === 'upload' && !file) { showToast('Please select a CSV or Excel file.', 'warn'); return; }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('customer_id', customerId);
      formData.append('invoice_no', invoiceNo);
      formData.append('bill_date', billDate);
      formData.append('due_date', dueDate);

      if (mode === 'upload') {
        formData.append('subtotal', subtotal || 0);
        formData.append('gst_total', gstTotal || 0);
        formData.append('grand_total', parseFloat(subtotal || 0) + parseFloat(gstTotal || 0));
        formData.append('bill_file_type', selectedCustomer?.preferred_bill_format || 'csv');
        formData.append('bill_file', file);
      } else {
        formData.append('subtotal', computedSubtotal);
        formData.append('gst_total', computedGst);
        formData.append('grand_total', grandTotal);
        formData.append('bill_file_type', 'pdf');
        lineItems.forEach((item, i) => {
          Object.keys(item).forEach(key => {
            formData.append(`line_items[${i}][${key}]`, item[key]);
          });
        });
      }

      await billsApi.upload(formData);
      showToast(`✓ Bill ${invoiceNo} uploaded for ${selectedCustomer?.name}`);
      navigate('/dashboard/bills');
    } catch (err) {
      showToast(err?.message || 'Failed to upload bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="breadcrumb">
        <a onClick={() => navigate('/dashboard')}>Dashboard</a>
        <span className="breadcrumb-sep">›</span>
        <span>Upload Bill</span>
      </div>
      <div className="pg-hdr">
        <div><div className="pg-title">Upload Bill</div><div className="pg-sub">Add a new bill for a customer account</div></div>
      </div>

      {/* Mode selector */}
      <div className="m-tabs" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <button className={`m-tab${mode === 'upload' ? ' active' : ''}`} onClick={() => setMode('upload')}>Upload File</button>
        <button className={`m-tab${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>Enter Line Items</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-layout">
          <div>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Bill details" />
              <div style={{ padding: '1.25rem 1.5rem' }}>

                {/* ── Customer dropdown ── */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Customer *</label>
                  {customersLoading ? (
                    <div className="form-ctrl" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12 }}>Loading customers…</span>
                    </div>
                  ) : (
                    <select
                      className="form-ctrl"
                      value={customerId}
                      onChange={e => handleCustomerChange(e.target.value)}
                      required
                    >
                      <option value="">— Select a customer —</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.customer_code}) · {c.preferred_bill_format?.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedCustomer && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 12 }}>
                      <span>📧 {selectedCustomer.email}</span>
                      <span>📄 Prefers: <strong>{selectedCustomer.preferred_bill_format?.toUpperCase()}</strong></span>
                      {selectedCustomer.outstanding_amount > 0 && (
                        <span style={{ color: 'var(--red)' }}>⚠ Outstanding: ₹{Number(selectedCustomer.outstanding_amount).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Invoice number *</label>
                    <input className="form-ctrl" placeholder="e.g. INV-2252" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bill date *</label>
                    <input className="form-ctrl" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Due date *</label>
                    <input className="form-ctrl" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  {mode === 'upload' && (
                    <div className="form-group">
                      <label className="form-label">Subtotal (₹)</label>
                      <input className="form-ctrl" type="number" placeholder="0.00" value={subtotal} onChange={e => setSubtotal(e.target.value)} />
                    </div>
                  )}
                  {mode === 'upload' && (
                    <div className="form-group">
                      <label className="form-label">GST total (₹)</label>
                      <input className="form-ctrl" type="number" placeholder="0.00" value={gstTotal} onChange={e => setGstTotal(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {mode === 'upload' ? (
              <Card style={{ marginBottom: '1.25rem' }}>
                <CardHeader title="Upload Bill File" />
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div
                    style={{ border: `2px dashed ${drag ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 12, padding: '2.5rem', textAlign: 'center', background: drag ? 'var(--blue-light)' : 'var(--surface-2)', transition: 'all .15s', cursor: 'pointer' }}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                    onClick={() => document.getElementById('file-inp').click()}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                      {file ? file.name : 'Drop CSV or Excel file here, or click to browse'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : '.csv, .xls, .xlsx · Max 10 MB'}
                    </div>
                    <input id="file-inp" type="file" accept=".csv,.xls,.xlsx" style={{ display: 'none' }}
                      onChange={e => setFile(e.target.files[0])} />
                  </div>
                  {selectedCustomer && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
                      File will be stored as <strong>{selectedCustomer.preferred_bill_format?.toUpperCase()}</strong> per customer preference
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card style={{ marginBottom: '1.25rem' }}>
                <CardHeader title="Line items" actions={<button type="button" className="btn btn-outline btn-sm" onClick={addLine}>+ Add row</button>} />
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product name</th><th>HSN</th><th>Qty</th><th>Unit</th>
                        <th>Rate (₹)</th><th>GST %</th><th>Total</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((l, i) => (
                        <tr key={i}>
                          <td><input className="form-ctrl" placeholder="Product name" value={l.product} onChange={e => updateLine(i, 'product', e.target.value)} /></td>
                          <td><input className="form-ctrl" placeholder="HSN" value={l.hsn} onChange={e => updateLine(i, 'hsn', e.target.value)} style={{ width: 80 }} /></td>
                          <td><input className="form-ctrl" type="number" placeholder="0" value={l.qty} onChange={e => updateLine(i, 'qty', e.target.value)} style={{ width: 70 }} /></td>
                          <td>
                            <select className="form-ctrl" value={l.unit} onChange={e => updateLine(i, 'unit', e.target.value)} style={{ width: 80 }}>
                              <option>Nos</option><option>Box</option><option>Strip</option><option>Kg</option><option>Ltr</option>
                            </select>
                          </td>
                          <td><input className="form-ctrl" type="number" placeholder="0" value={l.rate} onChange={e => updateLine(i, 'rate', e.target.value)} style={{ width: 90 }} /></td>
                          <td>
                            <select className="form-ctrl" value={l.gst} onChange={e => updateLine(i, 'gst', e.target.value)} style={{ width: 80 }}>
                              <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                            </select>
                          </td>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>₹{lineTotal(l).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{lineItems.length > 1 && <button type="button" className="btn-xs danger" onClick={() => removeLine(i)}>✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    Grand Total: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </Card>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Uploading…' : '↑ Upload Bill'}
              </button>
            </div>
          </div>

          {/* Right info panel */}
          <div>
            <Card style={{ marginBottom: 0 }}>
              <CardHeader title="Upload guide" />
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { emoji: '👤', title: 'Select the customer', desc: 'Pick the customer from the dropdown. Their preferred format (CSV or Excel) is shown automatically.' },
                  { emoji: '📅', title: 'Set correct due date', desc: 'Reminders are triggered based on the due date. Double-check before uploading.' },
                  { emoji: '📊', title: 'CSV or Excel format', desc: 'Upload .csv, .xls, or .xlsx files (max 10 MB). The file is stored and delivered in the customer\'s preferred format.' },
                  { emoji: '🔔', title: 'Reminders fire automatically', desc: 'Once uploaded, the reminder engine will send notifications based on your active rules.' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
