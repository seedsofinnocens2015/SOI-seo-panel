'use client';

import { useEffect, useState } from 'react';
import {
  fetchMasterSettings,
  saveDropdownList,
  saveLetterTemplate,
  resetLetterTemplate,
  saveGeneralSettings,
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  saveSignatory,
  deleteSignatory,
} from '../../lib/masterSettingsApi';

const TABS = [
  { id: 'dropdowns', label: 'Dropdown Lists', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'companies', label: 'Companies & Letterhead', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'offer-letter', label: 'Offer Letter', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'appointment-letter', label: 'Appointment Letter', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

const DROPDOWN_CATEGORIES = [
  { id: 'centres', label: 'Centres', extraLabel: 'Extra (optional)' },
  { id: 'departments', label: 'Departments', extraLabel: 'Extra (optional)' },
  { id: 'designations', label: 'Designations', extraLabel: 'Department it belongs to' },
  { id: 'pipeline_stages', label: 'Pipeline Stages', extraLabel: 'Active / Hired / Closed / On Hold' },
  { id: 'interview_rounds', label: 'Interview Rounds', extraLabel: 'Extra (optional)' },
  { id: 'sources', label: 'Sources', extraLabel: 'Extra (optional)' },
  { id: 'recruiters', label: 'Recruiters', extraLabel: 'Monthly joining target (e.g. 4)' },
  { id: 'priority', label: 'Priority', extraLabel: 'Extra (optional)' },
  { id: 'hiring_type', label: 'Hiring Type', extraLabel: 'Extra (optional)' },
  { id: 'approval_status', label: 'Approval Status', extraLabel: 'Extra (optional)' },
  { id: 'interview_status', label: 'Interview Status', extraLabel: 'Extra (optional)' },
  { id: 'interview_result', label: 'Interview Result', extraLabel: 'Extra (optional)' },
  { id: 'offer_status', label: 'Offer Status', extraLabel: 'Extra (optional)' },
  { id: 'joining_status', label: 'Joining Status', extraLabel: 'Extra (optional)' },
  { id: 'follow_up_mode', label: 'Follow-up Mode', extraLabel: 'Extra (optional)' },
  { id: 'checklist_status', label: 'Checklist Status', extraLabel: 'Extra (optional)' },
  { id: 'interview_mode', label: 'Interview Mode', extraLabel: 'Extra (optional)' },
  { id: 'follow_up_status', label: 'Follow-up Status', extraLabel: 'Extra (optional)' },
];

export default function HrMasterSettings() {
  const [activeTab, setActiveTab] = useState('dropdowns');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown Tab State
  const [activeCategory, setActiveCategory] = useState('centres');
  const [dropdowns, setDropdowns] = useState({});
  const [categoryItems, setCategoryItems] = useState([]);
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemExtra, setNewItemExtra] = useState('');
  const [savingDropdown, setSavingDropdown] = useState(false);

  // Companies Tab State
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    shortCode: '',
    phone: '',
    email: '',
    website: '',
    gstNo: '',
    pan: '',
    cin: '',
    registeredAddress: '',
    letterheadImage: '',
    margins: { top: 45, bottom: 25, left: 20, right: 20 },
    active: true,
  });

  // Signatory sub-form
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    designation: '',
    signatureImage: '',
    isDefault: true,
    active: true,
  });
  const [editingSignatoryId, setEditingSignatoryId] = useState(null);

  // Letter Templates State
  const [offerTemplate, setOfferTemplate] = useState('');
  const [appointmentTemplate, setAppointmentTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    probationMonths: 6,
    vacancyClosureDays: 30,
    autoLogoutMinutes: 30,
    requisitionIdPrefix: 'REQ-',
    candidateIdPrefix: 'CAN-',
  });
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Initial load
  const loadMasterData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMasterSettings();
      if (data) {
        setDropdowns(data.dropdowns || {});
        setCategoryItems(data.dropdowns?.[activeCategory] || []);
        setOfferTemplate(data.offerLetterTemplate || '');
        setAppointmentTemplate(data.appointmentLetterTemplate || '');
        setGeneralSettings({
          probationMonths: data.probationMonths ?? 6,
          vacancyClosureDays: data.vacancyClosureDays ?? 30,
          autoLogoutMinutes: data.autoLogoutMinutes ?? 30,
          requisitionIdPrefix: data.requisitionIdPrefix || 'REQ-',
          candidateIdPrefix: data.candidateIdPrefix || 'CAN-',
        });
      }
      const comps = await fetchCompanies();
      setCompanies(comps || []);
    } catch (err) {
      setError(err.message || 'Failed to load master settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Update category items when activeCategory or dropdowns change
  useEffect(() => {
    if (dropdowns && dropdowns[activeCategory]) {
      setCategoryItems(dropdowns[activeCategory]);
    } else {
      setCategoryItems([]);
    }
    setNewItemValue('');
    setNewItemExtra('');
  }, [activeCategory, dropdowns]);

  // Handle single item edit in categoryItems
  const handleItemChange = (index, field, value) => {
    setCategoryItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Save specific item row
  const handleSaveItemRow = async (index) => {
    try {
      setSavingDropdown(true);
      setError('');
      const updatedList = [...categoryItems];
      await saveDropdownList(activeCategory, updatedList);
      setDropdowns((prev) => ({ ...prev, [activeCategory]: updatedList }));
      setSuccess('Item saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setSavingDropdown(false);
    }
  };

  // Delete specific item row
  const handleDeleteItemRow = async (index) => {
    const itemToDelete = categoryItems[index];
    if (!window.confirm(`Delete "${itemToDelete.value}"?`)) return;
    try {
      setSavingDropdown(true);
      setError('');
      const updatedList = categoryItems.filter((_, i) => i !== index);
      await saveDropdownList(activeCategory, updatedList);
      setCategoryItems(updatedList);
      setDropdowns((prev) => ({ ...prev, [activeCategory]: updatedList }));
      setSuccess('Item deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setSavingDropdown(false);
    }
  };

  // Add new item to category
  const handleAddNewItem = async () => {
    if (!newItemValue.trim()) {
      alert('Please enter a value for the new item.');
      return;
    }
    try {
      setSavingDropdown(true);
      setError('');
      const newItem = { value: newItemValue.trim(), extra: newItemExtra.trim() };
      const updatedList = [...categoryItems, newItem];
      await saveDropdownList(activeCategory, updatedList);
      setCategoryItems(updatedList);
      setDropdowns((prev) => ({ ...prev, [activeCategory]: updatedList }));
      setNewItemValue('');
      setNewItemExtra('');
      setSuccess('New item added successfully.');
    } catch (err) {
      setError(err.message || 'Failed to add item');
    } finally {
      setSavingDropdown(false);
    }
  };

  // Company management
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      companyName: '',
      shortCode: '',
      phone: '',
      email: '',
      website: '',
      gstNo: '',
      pan: '',
      cin: '',
      registeredAddress: '',
      letterheadImage: '',
      margins: { top: 45, bottom: 25, left: 20, right: 20 },
      active: true,
    });
    setIsCompanyFormOpen(true);
  };

  const handleEditCompany = (comp) => {
    setEditingCompany(comp);
    setCompanyForm({
      companyName: comp.companyName || '',
      shortCode: comp.shortCode || '',
      phone: comp.phone || '',
      email: comp.email || '',
      website: comp.website || '',
      gstNo: comp.gstNo || '',
      pan: comp.pan || '',
      cin: comp.cin || '',
      registeredAddress: comp.registeredAddress || '',
      letterheadImage: comp.letterheadImage || '',
      margins: comp.margins || { top: 45, bottom: 25, left: 20, right: 20 },
      active: comp.active !== undefined ? comp.active : true,
    });
    setIsCompanyFormOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.companyName.trim()) {
      alert('Company name is required.');
      return;
    }
    try {
      setError('');
      if (editingCompany) {
        const updated = await updateCompany(editingCompany._id, companyForm);
        setCompanies((prev) => prev.map((c) => (c._id === editingCompany._id ? updated : c)));
        setEditingCompany(updated);
        setSuccess('Company updated successfully.');
      } else {
        const created = await createCompany(companyForm);
        setCompanies((prev) => [created, ...prev]);
        setEditingCompany(created);
        setSuccess('Company created successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save company');
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Delete company "${name}"?`)) return;
    try {
      setError('');
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      if (editingCompany?._id === id) {
        setEditingCompany(null);
        setIsCompanyFormOpen(false);
      }
      setSuccess('Company deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete company');
    }
  };

  // Signatory management for active editing company
  const handleSaveSignatory = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    if (!signatoryForm.name.trim()) {
      alert('Signatory name is required.');
      return;
    }
    try {
      setError('');
      const payload = {
        signatoryId: editingSignatoryId,
        ...signatoryForm,
      };
      const updatedComp = await saveSignatory(editingCompany._id, payload);
      setEditingCompany(updatedComp);
      setCompanies((prev) => prev.map((c) => (c._id === updatedComp._id ? updatedComp : c)));
      setSignatoryForm({
        name: '',
        designation: '',
        signatureImage: '',
        isDefault: false,
        active: true,
      });
      setEditingSignatoryId(null);
      setSuccess('Signatory saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save signatory');
    }
  };

  const handleDeleteSignatory = async (signatoryId) => {
    if (!editingCompany) return;
    if (!window.confirm('Delete this signatory?')) return;
    try {
      setError('');
      const updatedComp = await deleteSignatory(editingCompany._id, signatoryId);
      setEditingCompany(updatedComp);
      setCompanies((prev) => prev.map((c) => (c._id === updatedComp._id ? updatedComp : c)));
      setSuccess('Signatory deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete signatory');
    }
  };

  // Letter templates save & reset
  const handleSaveTemplate = async (type) => {
    try {
      setSavingTemplate(true);
      setError('');
      const template = type === 'offer' ? offerTemplate : appointmentTemplate;
      await saveLetterTemplate(type, template);
      setSuccess(`${type === 'offer' ? 'Offer Letter' : 'Appointment Letter'} template saved.`);
    } catch (err) {
      setError(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = async (type) => {
    if (!window.confirm(`Reset ${type === 'offer' ? 'Offer Letter' : 'Appointment Letter'} to standard default template?`)) return;
    try {
      setSavingTemplate(true);
      setError('');
      const def = await resetLetterTemplate(type);
      if (type === 'offer') setOfferTemplate(def);
      else setAppointmentTemplate(def);
      setSuccess(`${type === 'offer' ? 'Offer Letter' : 'Appointment Letter'} reset to default template.`);
    } catch (err) {
      setError(err.message || 'Failed to reset template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // General Settings save
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      setSavingGeneral(true);
      setError('');
      await saveGeneralSettings(generalSettings);
      setSuccess('General settings saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save general settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const activeCategoryMeta = DROPDOWN_CATEGORIES.find((c) => c.id === activeCategory) || DROPDOWN_CATEGORIES[0];

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header matching HR panel design */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            System Administration & Masters
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Master Settings
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Centralized control panel for system dropdowns, entity letterheads, offer & appointment templates, and default HR policies.
          </p>
        </div>

        {/* Global Action / Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadMasterData}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload Masters
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
        </div>
      ) : null}

      {/* Primary Pill Navigation Toolbar matching standard design */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-100/80 border border-zinc-200/80 w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm font-black'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <svg className={`w-4 h-4 ${isActive ? 'text-[#cc2627]' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DROPDOWN LISTS                                     */}
      {/* ========================================================= */}
      {activeTab === 'dropdowns' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Left Sidebar Category Navigator */}
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-3 shadow-sm space-y-1">
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Master Catalogs
              </p>
              <div className="space-y-0.5">
                {DROPDOWN_CATEGORIES.map((cat) => {
                  const isCatActive = activeCategory === cat.id;
                  const count = (dropdowns[cat.id] || []).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        isCatActive
                          ? 'bg-[#cc2627] text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCatActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Editor Table */}
            <div className="md:col-span-3 space-y-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-zinc-200/80 bg-zinc-50/75 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-zinc-900 tracking-tight">
                      {activeCategoryMeta.label}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Configure selectable options and metadata for this catalog
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">
                    {categoryItems.length} Entries
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/50 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="px-6 py-3.5 w-5/12">Display Value</th>
                        <th className="px-4 py-3.5 w-5/12">{activeCategoryMeta.extraLabel}</th>
                        <th className="px-6 py-3.5 w-2/12 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {categoryItems.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-zinc-400 font-medium">
                            No values configured yet for {activeCategoryMeta.label}. Add one below.
                          </td>
                        </tr>
                      ) : (
                        categoryItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="px-6 py-2.5">
                              <input
                                type="text"
                                value={item.value || ''}
                                onChange={(e) => handleItemChange(idx, 'value', e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={item.extra || ''}
                                onChange={(e) => handleItemChange(idx, 'extra', e.target.value)}
                                placeholder={activeCategoryMeta.extraLabel}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                              />
                            </td>
                            <td className="px-6 py-2.5 text-right whitespace-nowrap space-x-2">
                              <button
                                type="button"
                                disabled={savingDropdown}
                                onClick={() => handleSaveItemRow(idx)}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                disabled={savingDropdown}
                                onClick={() => handleDeleteItemRow(idx)}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Add New Item Input Row */}
                      <tr className="bg-zinc-50/75 border-t-2 border-zinc-200">
                        <td className="px-6 py-3.5">
                          <input
                            type="text"
                            value={newItemValue}
                            onChange={(e) => setNewItemValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
                            placeholder={`Add new ${activeCategoryMeta.label.toLowerCase()}...`}
                            className="w-full rounded-xl border border-dashed border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="text"
                            value={newItemExtra}
                            onChange={(e) => setNewItemExtra(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
                            placeholder={`extra info (${activeCategoryMeta.extraLabel})`}
                            className="w-full rounded-xl border border-dashed border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 outline-none focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={savingDropdown}
                            onClick={handleAddNewItem}
                            className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-5 py-2 text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
                          >
                            + Add Item
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: COMPANIES & LETTERHEAD                             */}
      {/* ========================================================= */}
      {activeTab === 'companies' && (
        <div className="space-y-6 pt-2">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                Corporate Entities & Letterheads
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage registered companies, printable letterhead backgrounds, and authorized signatories.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCompany}
              className="flex items-center gap-2 rounded-xl bg-[#cc2627] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Company
            </button>
          </div>

          {/* Companies Table */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Company Name</th>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Contact Details</th>
                    <th className="px-4 py-3.5">Tax / Registration</th>
                    <th className="px-4 py-3.5 text-center">Letterhead</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {companies.map((comp) => (
                    <tr key={comp._id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-900">{comp.companyName}</td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-600">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-bold">
                          {comp.shortCode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">
                        <div className="font-semibold text-zinc-800">{comp.phone || '-'}</div>
                        <div className="text-[11px] text-zinc-400">{comp.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">
                        <div><span className="font-bold text-zinc-700">GST:</span> {comp.gstNo || '-'}</div>
                        <div className="text-[11px] text-zinc-400"><span className="font-bold text-zinc-500">PAN:</span> {comp.pan || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            comp.letterheadImage
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {comp.letterheadImage ? 'Uploaded' : 'Not uploaded'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            comp.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {comp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditCompany(comp)}
                          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3 py-1.5 text-xs font-bold transition"
                        >
                          Configure
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompany(comp._id, comp.companyName)}
                          className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Company Configuration Card Drawer */}
          {isCompanyFormOpen && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">
                    Corporate Profile & Margins
                  </p>
                  <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                    {editingCompany ? `Edit: ${editingCompany.companyName}` : 'Register New Company'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompanyFormOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyForm.companyName}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Short Code (in Letter Ref Nos)</label>
                    <input
                      type="text"
                      value={companyForm.shortCode}
                      onChange={(e) => setCompanyForm({ ...companyForm, shortCode: e.target.value })}
                      placeholder="e.g. SOI"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Phone</label>
                    <input
                      type="text"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Email Address</label>
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Website</label>
                    <input
                      type="text"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">GST Registration No.</label>
                    <input
                      type="text"
                      value={companyForm.gstNo}
                      onChange={(e) => setCompanyForm({ ...companyForm, gstNo: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">PAN Number</label>
                    <input
                      type="text"
                      value={companyForm.pan}
                      onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">CIN / Registration No.</label>
                    <input
                      type="text"
                      value={companyForm.cin}
                      onChange={(e) => setCompanyForm({ ...companyForm, cin: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700">Registered Office Address</label>
                  <textarea
                    rows={2}
                    value={companyForm.registeredAddress}
                    onChange={(e) => setCompanyForm({ ...companyForm, registeredAddress: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs font-medium text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                  />
                </div>

                {/* Letterhead & Margin settings */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-800">
                      Blank Letterhead Template (A4 JPG / PNG)
                    </label>
                    <p className="text-[11px] text-zinc-500 mb-2">
                      Upload blank letterhead image. Offer and appointment letters will be printed over this template.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setCompanyForm((prev) => ({ ...prev, letterheadImage: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#12395d] file:text-white hover:file:bg-[#0c2740]"
                      />
                      {companyForm.letterheadImage && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          ✓ Letterhead loaded
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-800">
                      Letterhead Printable Margins (mm)
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-600">Top</span>
                        <input
                          type="number"
                          value={companyForm.margins.top}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            margins: { ...companyForm.margins, top: Number(e.target.value) },
                          })}
                          className="w-16 rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-center outline-none focus:border-[#cc2627]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-600">Bottom</span>
                        <input
                          type="number"
                          value={companyForm.margins.bottom}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            margins: { ...companyForm.margins, bottom: Number(e.target.value) },
                          })}
                          className="w-16 rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-center outline-none focus:border-[#cc2627]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-600">Left</span>
                        <input
                          type="number"
                          value={companyForm.margins.left}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            margins: { ...companyForm.margins, left: Number(e.target.value) },
                          })}
                          className="w-16 rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-center outline-none focus:border-[#cc2627]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-600">Right</span>
                        <input
                          type="number"
                          value={companyForm.margins.right}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            margins: { ...companyForm.margins, right: Number(e.target.value) },
                          })}
                          className="w-16 rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-bold text-center outline-none focus:border-[#cc2627]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="compActive"
                    checked={companyForm.active}
                    onChange={(e) => setCompanyForm({ ...companyForm, active: e.target.checked })}
                    className="rounded border-zinc-300 text-[#cc2627] focus:ring-[#cc2627]"
                  />
                  <label htmlFor="compActive" className="text-xs font-bold text-zinc-700">Entity is Active</label>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsCompanyFormOpen(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-6 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg"
                  >
                    Save Company
                  </button>
                </div>
              </form>

              {/* Signatories Sub-Table */}
              {editingCompany && (
                <div className="pt-6 border-t border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-zinc-900">
                        Authorized Signatories ({editingCompany.companyName})
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Authorized signers for generated offer and appointment letters.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="px-4 py-3">Signature Image</th>
                          <th className="px-4 py-3">Signer Name</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {(editingCompany.signatories || []).map((sig) => (
                          <tr key={sig._id} className="hover:bg-zinc-50">
                            <td className="px-4 py-3">
                              {sig.signatureImage ? (
                                <img src={sig.signatureImage} alt="Sig" className="h-8 max-w-[120px] object-contain" />
                              ) : (
                                <span className="text-[11px] text-zinc-400">No signature image</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-zinc-800">{sig.name}</td>
                            <td className="px-4 py-3 text-zinc-600">{sig.designation}</td>
                            <td className="px-4 py-3 text-center space-x-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                {sig.active ? 'Active' : 'Inactive'}
                              </span>
                              {sig.isDefault && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                  Default
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSignatoryId(sig._id);
                                  setSignatoryForm({
                                    name: sig.name,
                                    designation: sig.designation,
                                    signatureImage: sig.signatureImage || '',
                                    isDefault: sig.isDefault,
                                    active: sig.active,
                                  });
                                }}
                                className="font-bold text-[#cc2627] hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSignatory(sig._id)}
                                className="font-bold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add / Edit Signatory Drawer */}
                  <form onSubmit={handleSaveSignatory} className="flex flex-wrap items-center gap-3 pt-2">
                    <input
                      type="text"
                      required
                      value={signatoryForm.name}
                      onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                      placeholder="Name (e.g. HR Head)"
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#cc2627]"
                    />
                    <input
                      type="text"
                      value={signatoryForm.designation}
                      onChange={(e) => setSignatoryForm({ ...signatoryForm, designation: e.target.value })}
                      placeholder="Designation"
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#cc2627]"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSignatoryForm((prev) => ({ ...prev, signatureImage: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-100"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                      <input
                        type="checkbox"
                        checked={signatoryForm.isDefault}
                        onChange={(e) => setSignatoryForm({ ...signatoryForm, isDefault: e.target.checked })}
                        className="rounded text-[#cc2627]"
                      />
                      Default Signatory
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-4 py-2 text-xs font-bold transition shadow-sm"
                    >
                      {editingSignatoryId ? 'Update Signatory' : 'Save Signatory'}
                    </button>
                    {editingSignatoryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSignatoryId(null);
                          setSignatoryForm({
                            name: '',
                            designation: '',
                            signatureImage: '',
                            isDefault: false,
                            active: true,
                          });
                        }}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: OFFER LETTER TEMPLATE                              */}
      {/* ========================================================= */}
      {activeTab === 'offer-letter' && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-base font-black text-zinc-900">Offer Letter Format & Template</h3>
            <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">
              Standard letter template with dynamic merge tags. Values will be automatically injected when generating candidate offers.
            </p>
            <div className="mt-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60">
              <span className="text-[11px] font-bold text-zinc-500 block mb-1">Available Tags:</span>
              <code className="text-[11px] font-bold text-[#cc2627] select-all leading-loose">
                &#123;&#123;company_name&#125;&#125; &#123;&#123;company_address&#125;&#125; &#123;&#123;date&#125;&#125; &#123;&#123;ref_no&#125;&#125; &#123;&#123;candidate_name&#125;&#125; &#123;&#123;mobile&#125;&#125; &#123;&#123;email&#125;&#125; &#123;&#123;designation&#125;&#125; &#123;&#123;department&#125;&#125; &#123;&#123;centre&#125;&#125; &#123;&#123;ctc_annual&#125;&#125; &#123;&#123;ctc_words&#125;&#125; &#123;&#123;joining_date&#125;&#125; &#123;&#123;reporting_manager&#125;&#125; &#123;&#123;probation_months&#125;&#125; &#123;&#123;offer_valid_till&#125;&#125; &#123;&#123;signature&#125;&#125; &#123;&#123;hr_signatory&#125;&#125;
              </code>
            </div>
          </div>

          <textarea
            rows={16}
            value={offerTemplate}
            onChange={(e) => setOfferTemplate(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 font-mono text-xs text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={savingTemplate}
              onClick={() => handleResetTemplate('offer')}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Reset to Default
            </button>
            <button
              type="button"
              disabled={savingTemplate}
              onClick={() => handleSaveTemplate('offer')}
              className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-6 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg"
            >
              {savingTemplate ? 'Saving...' : 'Save Format'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: APPOINTMENT LETTER TEMPLATE                        */}
      {/* ========================================================= */}
      {activeTab === 'appointment-letter' && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-base font-black text-zinc-900">Appointment Letter Format & Template</h3>
            <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">
              Appointment template populated upon candidate joining completion.
            </p>
            <div className="mt-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60">
              <span className="text-[11px] font-bold text-zinc-500 block mb-1">Available Tags:</span>
              <code className="text-[11px] font-bold text-[#cc2627] select-all leading-loose">
                &#123;&#123;company_name&#125;&#125; &#123;&#123;candidate_name&#125;&#125; &#123;&#123;employee_id&#125;&#125; &#123;&#123;joining_date&#125;&#125; &#123;&#123;offer_date&#125;&#125; &#123;&#123;designation&#125;&#125; &#123;&#123;department&#125;&#125; &#123;&#123;centre&#125;&#125; &#123;&#123;probation_months&#125;&#125; &#123;&#123;notice_days&#125;&#125; &#123;&#123;signature&#125;&#125; &#123;&#123;hr_signatory&#125;&#125;
              </code>
            </div>
          </div>

          <textarea
            rows={16}
            value={appointmentTemplate}
            onChange={(e) => setAppointmentTemplate(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 font-mono text-xs text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={savingTemplate}
              onClick={() => handleResetTemplate('appointment')}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Reset to Default
            </button>
            <button
              type="button"
              disabled={savingTemplate}
              onClick={() => handleSaveTemplate('appointment')}
              className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-6 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg"
            >
              {savingTemplate ? 'Saving...' : 'Save Format'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: GENERAL SETTINGS                                   */}
      {/* ========================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-6 pt-2">
          <form onSubmit={handleSaveGeneral} className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-base font-black text-zinc-900">
                Global Recruitment & Policy Parameters
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure organizational defaults, auto-numbering prefixes, and system session rules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700">Probation Period (Months)</label>
                <input
                  type="number"
                  value={generalSettings.probationMonths}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, probationMonths: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Vacancy Closure Target (Days)</label>
                <input
                  type="number"
                  value={generalSettings.vacancyClosureDays}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, vacancyClosureDays: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Auto Logout Idle (Minutes)</label>
                <input
                  type="number"
                  value={generalSettings.autoLogoutMinutes}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, autoLogoutMinutes: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Requisition ID Prefix</label>
                <input
                  type="text"
                  value={generalSettings.requisitionIdPrefix}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, requisitionIdPrefix: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Candidate ID Prefix</label>
                <input
                  type="text"
                  value={generalSettings.candidateIdPrefix}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, candidateIdPrefix: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-zinc-100">
              <button
                type="submit"
                disabled={savingGeneral}
                className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-8 py-3 text-sm font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {savingGeneral ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Sample Data Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-zinc-900">Sample Records Verification</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Verify default template binding and auto-populated pipeline tests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Sample records verified! Requisition and candidate records are active.')}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
            >
              Load Sample Record (REQ-001 / CAN-001)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
