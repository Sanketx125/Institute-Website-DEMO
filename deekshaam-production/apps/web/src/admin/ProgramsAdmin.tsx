import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../components/Dialog';
import { SiteImage } from '../components/SiteImage';
import { useAdminFeedback } from './AdminFeedback';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

const PRESET_IMAGES = [
  { label: 'BCA / Technology', url: '/images/BCA.webp' },
  { label: 'Commerce & Arts', url: '/images/arts-1-qlt7sxguf5drb2bhqpcmn8bgp7vsuhsk0s0x3a09zc.jpg' },
  { label: 'Campus Quad', url: '/images/1.webp' },
  { label: 'Academic Library', url: '/images/2.webp' },
  { label: 'Main Faculty Block', url: '/images/Deekshaam-Buisness-School-Img-1.webp' },
];

export const ProgramsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [slugEditedByUser, setSlugEditedByUser] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvancedSlug, setShowAdvancedSlug] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form field strings for arrays
  const [specializationsStr, setSpecializationsStr] = useState('');
  const [careersStr, setCareersStr] = useState('');

  const fetchPrograms = () => {
    setLoading(true);
    api
      .getPrograms()
      .then((data) => {
        setPrograms(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load programs.');
      });
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in this academic program. Are you sure you want to discard them?')) {
        return;
      }
    }
    setEditingProgram(null);
    setIsDirty(false);
  };

  const openCreateModal = () => {
    setSlugEditedByUser(false);
    setIsDirty(false);
    setFormError(null);
    setSpecializationsStr('Artificial Intelligence, Data Analytics, Cloud Computing');
    setCareersStr('Software Engineer, Systems Analyst, Tech Consultant');
    setEditingProgram({
      isNew: true,
      code: '',
      slug: '',
      title: '',
      kicker: '',
      duration: '3 years',
      mode: 'Classroom learning',
      eligibility: '10+2 from recognized board; minimum 50% aggregate (45% for SC/ST/OBC).',
      summary: 'Comprehensive undergraduate degree program emphasizing hands-on project work, analytical problem-solving, and career readiness.',
      image: '/images/BCA.webp',
      applicationFee: 500,
      totalFee: 240000,
      specializations: ['Artificial Intelligence', 'Data Analytics', 'Cloud Computing'],
      careers: ['Software Engineer', 'Systems Analyst', 'Tech Consultant'],
      highlights: [],
      curriculum: [[], [], [], [], [], []],
      status: 'PUBLISHED',
    });
  };

  const openEditModal = (p: any) => {
    setSlugEditedByUser(true);
    setIsDirty(false);
    setFormError(null);
    const specs = Array.isArray(p.specializations)
      ? p.specializations.join(', ')
      : typeof p.specializations === 'string'
      ? p.specializations
      : '';
    const cars = Array.isArray(p.careers)
      ? p.careers.join(', ')
      : typeof p.careers === 'string'
      ? p.careers
      : '';
    setSpecializationsStr(specs);
    setCareersStr(cars);
    setEditingProgram({
      ...p,
      isNew: false,
      image: p.image || '/images/BCA.webp',
      applicationFee: p.applicationFee !== undefined ? Number(p.applicationFee) : 500,
      totalFee: p.totalFee !== undefined ? Number(p.totalFee) : 0,
    });
  };

  const handleTitleChange = (val: string) => {
    if (!editingProgram) return;
    setIsDirty(true);
    const next: any = { ...editingProgram, title: val };
    if (editingProgram.isNew && !slugEditedByUser) {
      next.slug = slugify(val || editingProgram.code);
    }
    setEditingProgram(next);
  };

  const handleCodeChange = (val: string) => {
    if (!editingProgram) return;
    setIsDirty(true);
    const next: any = { ...editingProgram, code: val };
    if (editingProgram.isNew && !slugEditedByUser && !editingProgram.title) {
      next.slug = slugify(val);
    }
    setEditingProgram(next);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'programs');
    formData.append('altText', editingProgram?.title || file.name);

    setUploadingImage(true);
    setFormError(null);
    try {
      const media = await api.uploadMedia(formData);
      setIsDirty(true);
      setEditingProgram((prev: any) => ({ ...prev, image: media.url }));
      notify('Program banner image uploaded successfully.');
    } catch (err: any) {
      setFormError(`Image upload failed: ${err.message}`);
      notify(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    setFormError(null);

    const cleanCode = (editingProgram.code || '').trim().toUpperCase();
    let cleanSlug = (editingProgram.slug || '').trim().toLowerCase();
    const cleanTitle = (editingProgram.title || '').trim();
    const cleanKicker = (editingProgram.kicker || '').trim();
    const cleanDuration = (editingProgram.duration || '3 years').trim();
    const cleanMode = (editingProgram.mode || 'Classroom learning').trim();
    const cleanEligibility = (editingProgram.eligibility || '').trim();
    const cleanSummary = (editingProgram.summary || '').trim();
    const cleanImage = (editingProgram.image || '/images/BCA.webp').trim();
    const appFee = Number(editingProgram.applicationFee);
    const totFee = Number(editingProgram.totalFee);

    // Auto-derive slug if missing or too short so non-technical staff are never blocked
    if (!cleanSlug || cleanSlug.length < 2) {
      cleanSlug = slugify(cleanCode || cleanTitle || 'program');
    }

    // Client-side validations
    if (cleanCode.length < 2) {
      setFormError('Program code must be at least 2 characters (e.g. BCA, BBA).');
      return;
    }
    if (cleanTitle.length < 3) {
      setFormError('Program title must be at least 3 characters.');
      return;
    }
    if (cleanSummary.length < 10) {
      setFormError('Overview summary must be at least 10 characters.');
      return;
    }
    if (cleanEligibility.length < 5) {
      setFormError('Eligibility criteria must be at least 5 characters.');
      return;
    }
    if (isNaN(appFee) || appFee < 0) {
      setFormError('Application processing fee must be a valid non-negative amount in ₹.');
      return;
    }
    if (isNaN(totFee) || totFee < 0) {
      setFormError('Total program course fee must be a valid non-negative amount in ₹.');
      return;
    }

    const specializations = specializationsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const careers = careersStr
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      code: cleanCode,
      slug: cleanSlug,
      title: cleanTitle,
      kicker: cleanKicker,
      duration: cleanDuration,
      mode: cleanMode,
      eligibility: cleanEligibility,
      summary: cleanSummary,
      image: cleanImage,
      applicationFee: appFee,
      totalFee: totFee,
      specializations,
      careers,
      highlights: Array.isArray(editingProgram.highlights) ? editingProgram.highlights : [],
      curriculum: Array.isArray(editingProgram.curriculum) ? editingProgram.curriculum : [[], [], [], [], [], []],
      status: editingProgram.status || 'PUBLISHED',
    };

    try {
      if (editingProgram.id && !editingProgram.isNew) {
        await api.updateProgram(editingProgram.id, payload);
        notify(`Program "${cleanCode}" updated successfully.`);
      } else {
        await api.createProgram(payload);
        notify(`Program "${cleanCode}" created successfully.`);
      }
      setIsDirty(false);
      setEditingProgram(null);
      fetchPrograms();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please verify the input values.');
      notify(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (item: any) => {
    setDeleting(true);
    try {
      await api.deleteProgram(item.id || item.slug);
      setDeleteItem(null);
      fetchPrograms();
      notify(`Program "${item.code}" has been removed.`);
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.summary && p.summary.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Academic Degree Programs
          </h1>
          <p style={{ color: '#777', margin: 0 }}>
            Manage curriculum details, program banners, specializations, and eligibility criteria.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Icon name="arrow" size={16} /> Add New Program
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search programs by code, title or syllabus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            maxWidth: '360px',
            border: '1px solid #dcd8d3',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
          }}
        />
        <span style={{ fontSize: '13px', color: '#666' }}>
          Showing {filteredPrograms.length} of {programs.length} programs
        </span>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#777' }}>Loading programs catalog...</div>
        ) : filteredPrograms.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#777' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>No programs found</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Try clearing your search query or add a new program.</p>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Banner</th>
                  <th>Code</th>
                  <th>Title & Kicker</th>
                  <th>Duration & Mode</th>
                  <th>Specializations</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((p) => (
                  <tr key={p.id || p.slug}>
                    <td>
                      <div
                        style={{
                          width: '56px',
                          height: '40px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {p.image ? (
                          <SiteImage
                            src={p.image}
                            alt={p.code}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>NO IMG</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#112e46' }}>{p.code}</strong>
                    </td>
                    <td>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px' }}>{p.title}</strong>
                        {p.kicker && <small style={{ color: '#64748b', fontSize: '12px' }}>{p.kicker}</small>}
                        <div style={{ fontSize: '11px', color: '#1e3a8a', marginTop: '3px', fontWeight: 600 }}>
                          App Fee: ₹{p.applicationFee !== undefined ? p.applicationFee : 500}
                          {p.totalFee ? ` · Total Course: ₹${Number(p.totalFee).toLocaleString('en-IN')}` : ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        {p.duration || '3 years'} · {p.mode || 'Classroom'}
                      </span>
                    </td>
                    <td>
                      {Array.isArray(p.specializations) && p.specializations.length > 0 ? (
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          {p.specializations.length} tracks ({p.specializations.slice(0, 2).join(', ')}
                          {p.specializations.length > 2 ? '...' : ''})
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>General</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'PUBLISHED'
                            ? 'badge-success'
                            : p.status === 'DRAFT'
                            ? 'badge-neutral'
                            : 'badge-warning'
                        }`}
                      >
                        {p.status || 'PUBLISHED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn btn-ghost small" onClick={() => openEditModal(p)}>
                          Edit
                        </button>
                        <a
                          href={`/academics/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost small"
                          title="Open public academic page"
                        >
                          View
                        </a>
                        <button
                          className="btn btn-ghost small"
                          style={{ color: '#dc2626' }}
                          onClick={() => setDeleteItem(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT / CREATE MODAL */}
      {editingProgram && (
        <Dialog
          open={true}
          onClose={handleCloseModal}
          preventBackdropClose={true}
          preventEscapeClose={true}
          label={editingProgram.isNew ? 'Create New Program' : `Edit ${editingProgram.code}`}
          className="workspace-editor"
        >
          <div className="workspace-editor-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">{editingProgram.isNew ? 'Catalog Addition' : `Code: ${editingProgram.code}`}</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0' }}>
                  {editingProgram.isNew ? 'Create New Academic Program' : `Edit Program: ${editingProgram.title || editingProgram.code}`}
                </h2>
              </div>
              <button type="button" className="icon-btn" title="Close" onClick={handleCloseModal}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* SECTION: BASIC INFO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <label>
                  Program Code *
                  <input
                    type="text"
                    required
                    value={editingProgram.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. BCA, BBA, B.Com"
                  />
                  <small style={{ color: '#64748b' }}>Short institutional code (min 2 chars)</small>
                </label>

                <label>
                  Full Program Title *
                  <input
                    type="text"
                    required
                    value={editingProgram.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Bachelor of Computer Applications"
                  />
                  <small style={{ color: '#64748b' }}>Official academic degree title</small>
                </label>
              </div>

              {/* AUTOMATIC WEB LINK WITH OPTIONAL ADVANCED CUSTOMISATION */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#475569',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Web Address: </span>
                  <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                    /academics/{editingProgram.slug || slugify(editingProgram.code || editingProgram.title || 'program')}
                  </code>
                  <span style={{ color: '#059669', marginLeft: '6px', fontWeight: 600 }}>✓ Auto-generated</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSlug(!showAdvancedSlug)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f766e',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  {showAdvancedSlug ? 'Hide custom link' : 'Customise web link (optional)'}
                </button>
              </div>

              {showAdvancedSlug && (
                <div style={{ marginBottom: '16px' }}>
                  <label>
                    Custom Web Link Slug
                    <input
                      type="text"
                      value={editingProgram.slug}
                      onChange={(e) => {
                        setSlugEditedByUser(true);
                        setIsDirty(true);
                        setEditingProgram({ ...editingProgram, slug: e.target.value });
                      }}
                      placeholder="e.g. bca, bba-business-analytics"
                    />
                    <small style={{ color: '#64748b' }}>Web link path: /academics/{editingProgram.slug || 'slug'}</small>
                  </label>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label>
                  Tagline / Kicker
                  <input
                    type="text"
                    value={editingProgram.kicker}
                    onChange={(e) => {
                      setIsDirty(true);
                      setEditingProgram({ ...editingProgram, kicker: e.target.value });
                    }}
                    placeholder="e.g. Software, data, cloud and intelligent systems"
                  />
                </label>
              </div>

              {/* SECTION: FEE CONFIGURATION (SUPER ADMIN DECIDED) */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  margin: '12px 0',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', color: '#166534' }}>Fee Configuration (Super Admin Controlled)</strong>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Set the official application processing fee charged to students during online checkout and total degree course fee.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <label style={{ margin: 0 }}>
                    Application Processing Fee (₹) *
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={editingProgram.applicationFee !== undefined ? editingProgram.applicationFee : 500}
                      onChange={(e) => {
                        setIsDirty(true);
                        setEditingProgram({ ...editingProgram, applicationFee: Number(e.target.value) });
                      }}
                      placeholder="e.g. 500 or 750"
                    />
                    <small style={{ color: '#64748b' }}>Actual charge applied when student applies online (discounts apply on this)</small>
                  </label>

                  <label style={{ margin: 0 }}>
                    Total Degree / Course Fee (₹) *
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      required
                      value={editingProgram.totalFee !== undefined ? editingProgram.totalFee : 0}
                      onChange={(e) => {
                        setIsDirty(true);
                        setEditingProgram({ ...editingProgram, totalFee: Number(e.target.value) });
                      }}
                      placeholder="e.g. 240000"
                    />
                    <small style={{ color: '#64748b' }}>Total institutional degree fee across all semesters displayed to prospective students</small>
                  </label>
                </div>
              </div>

              {/* SECTION: IMAGE & BANNER */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>Program Banner & Image</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Displayed on program cards, detail header banners, and admissions catalog.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '75px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                      flexShrink: 0,
                    }}
                  >
                    {editingProgram.image ? (
                      <SiteImage
                        src={editingProgram.image}
                        alt="Banner Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: '#94a3b8',
                        }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ margin: 0 }}>
                      Image URL
                      <input
                        type="text"
                        value={editingProgram.image}
                        onChange={(e) => {
                          setIsDirty(true);
                          setEditingProgram({ ...editingProgram, image: e.target.value });
                        }}
                        placeholder="/images/BCA.webp or https://..."
                      />
                    </label>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary small"
                        style={{ margin: 0, width: 'auto', cursor: uploadingImage ? 'wait' : 'pointer' }}
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Icon name="arrow" size={14} />
                        {uploadingImage ? 'Uploading Image...' : 'Upload Image File'}
                      </button>
                      <small style={{ color: '#64748b' }}>JPG, PNG or WebP</small>
                    </div>
                  </div>
                </div>

                {/* Preset Picker */}
                <div>
                  <small style={{ fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Or select from preset campus imagery:
                  </small>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setEditingProgram({ ...editingProgram, image: preset.url });
                        }}
                        style={{
                          background: editingProgram.image === preset.url ? '#1e3a8a' : '#ffffff',
                          color: editingProgram.image === preset.url ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: ACADEMIC DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <label>
                  Duration *
                  <input
                    type="text"
                    required
                    value={editingProgram.duration}
                    onChange={(e) => {
                      setIsDirty(true);
                      setEditingProgram({ ...editingProgram, duration: e.target.value });
                    }}
                    placeholder="e.g. 3 years (6 Semesters)"
                  />
                </label>

                <label>
                  Study Mode *
                  <input
                    type="text"
                    required
                    value={editingProgram.mode}
                    onChange={(e) => {
                      setIsDirty(true);
                      setEditingProgram({ ...editingProgram, mode: e.target.value });
                    }}
                    placeholder="e.g. Classroom learning"
                  />
                </label>
              </div>

              <label>
                Eligibility Criteria *
                <input
                  type="text"
                  required
                  value={editingProgram.eligibility}
                  onChange={(e) => {
                    setIsDirty(true);
                    setEditingProgram({ ...editingProgram, eligibility: e.target.value });
                  }}
                  placeholder="e.g. 10+2 from recognized board; minimum 50% aggregate"
                />
                <small style={{ color: '#64748b' }}>Admission prerequisites (min 5 characters)</small>
              </label>

              <label>
                Program Overview Summary *
                <textarea
                  rows={3}
                  required
                  value={editingProgram.summary}
                  onChange={(e) => {
                    setIsDirty(true);
                    setEditingProgram({ ...editingProgram, summary: e.target.value });
                  }}
                  placeholder="Detailed overview explaining syllabus highlights, learning outcomes, and career benefits..."
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                  <span>Min 10 characters required</span>
                  <span style={{ color: (editingProgram.summary || '').length >= 10 ? '#16a34a' : '#dc2626' }}>
                    {(editingProgram.summary || '').length} characters
                  </span>
                </div>
              </label>

              {/* SECTION: TRACKS & CAREERS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <label>
                  Specializations (Comma-separated)
                  <input
                    type="text"
                    value={specializationsStr}
                    onChange={(e) => {
                      setIsDirty(true);
                      setSpecializationsStr(e.target.value);
                    }}
                    placeholder="e.g. AI & ML, Data Analytics, Cloud Computing"
                  />
                  <small style={{ color: '#64748b' }}>Separate distinct tracks with commas</small>
                </label>

                <label>
                  Career Pathways (Comma-separated)
                  <input
                    type="text"
                    value={careersStr}
                    onChange={(e) => {
                      setIsDirty(true);
                      setCareersStr(e.target.value);
                    }}
                    placeholder="e.g. Software Engineer, Web Developer, IT Consultant"
                  />
                  <small style={{ color: '#64748b' }}>Separate career roles with commas</small>
                </label>
              </div>

              <label>
                Catalog Visibility Status
                <select
                  value={editingProgram.status || 'PUBLISHED'}
                  onChange={(e) => {
                    setIsDirty(true);
                    setEditingProgram({ ...editingProgram, status: e.target.value });
                  }}
                >
                  <option value="PUBLISHED">Published (Visible on public website and admissions)</option>
                  <option value="DRAFT">Draft (Under review, hidden from public)</option>
                  <option value="ARCHIVED">Archived (Decommissioned)</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : editingProgram.isNew ? 'Create Program' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteItem && (
        <Dialog
          open={true}
          onClose={() => {
            if (!deleting) setDeleteItem(null);
          }}
          label="Remove program"
          className="notification-dialog"
        >
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 10px', color: '#112e46' }}>
              Remove {deleteItem.code} ({deleteItem.title})?
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>
              This will remove the program from the public academic catalog and search indexes. Existing submitted applications
              referencing this program will remain intact in the admissions registry.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" disabled={deleting} onClick={() => setDeleteItem(null)}>
                Keep Program
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                disabled={deleting}
                onClick={() => handleDelete(deleteItem)}
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
