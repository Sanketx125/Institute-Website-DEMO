import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { track } from '../services/track';
import { NotificationModal, NotificationType } from '../components/NotificationModal';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpaySdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface ApplyProps {
  onNavigate: (path: string) => void;
}

export const Apply: React.FC<ApplyProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: NotificationType;
  } | null>(null);

  const showAlert = (message: string, title?: string, type: NotificationType = 'warning') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    state: '',
    city: '',
    programSlug: 'bca',
    specialization: '',
    board10: '',
    year10: '2022',
    board12: '',
    year12: '2024',
    stream: 'Science',
    percentage: '',
  });

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalFee: number;
    originalFee?: number;
    totalCourseFee?: number;
    message?: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSectionOpen, setPromoSectionOpen] = useState(false);
  const [promoSkipped, setPromoSkipped] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [docFiles, setDocFiles] = useState<{
    marksheet10?: File;
    marksheet12?: File;
    photo?: File;
    signature?: File;
  }>({});

  const currentYear = new Date().getFullYear();
  const maxDob = `${currentYear - 14}-12-31`;
  const minDob = `${currentYear - 65}-01-01`;

  const [programsList, setProgramsList] = useState<any[]>([]);

  useEffect(() => {
    api.getPrograms().then((progs) => setProgramsList(progs || [])).catch(() => {});
  }, []);

  const selectedProgram = programsList.find(
    (p) => p.slug === formData.programSlug || p.code?.toLowerCase() === formData.programSlug.toLowerCase()
  );
  const currentAppFee = selectedProgram && typeof selectedProgram.applicationFee === 'number' && selectedProgram.applicationFee > 0
    ? selectedProgram.applicationFee
    : 500;
  const currentTotalFee = selectedProgram?.totalFee || 0;

  const handleApplyPromo = async (codeToVerify?: string) => {
    const code = (codeToVerify || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await api.validatePromoCode(code, formData.programSlug);
      setAppliedPromo(res);
      setPromoCodeInput(code);
      setPromoSkipped(false);
      setPromoSectionOpen(true);
      showToast(`Promo code ${code} applied successfully!`);
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError('This code is not valid.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
    setPromoSkipped(false);
    showToast('Promo code removed.');
  };

  useEffect(() => {
    // Restore draft from local storage if present
    const saved = localStorage.getItem('dbs_application_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
        showToast('Saved application draft restored');
      } catch (e) {}
    }

    // Check query params for pre-selected program and referral code (?ref=CODE)
    const params = new URLSearchParams(window.location.search);
    const prog = params.get('program');
    if (prog) {
      setFormData((prev) => ({ ...prev, programSlug: prog }));
    }

    const ref = params.get('ref');
    if (ref) {
      const cleanRef = ref.trim().toUpperCase();
      setPromoCodeInput(cleanRef);
      setPromoSectionOpen(true);
      handleApplyPromo(cleanRef);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('dbs_application_draft', JSON.stringify(formData));
    showToast('Application draft saved successfully');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.dob || !formData.state || !formData.city) {
        showAlert('Please fill out all personal profile fields including full name, email, phone, date of birth, state, and city.', 'Incomplete Profile', 'warning');
        track('apply_error', { step: currentStep });
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.programSlug) {
        showAlert('Please select your preferred undergraduate degree program (BBA, BCA, or B.Com) to proceed.', 'Program Preference Required', 'warning');
        track('apply_error', { step: currentStep });
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.board10 || !formData.year10 || !formData.board12 || !formData.year12 || !formData.percentage) {
        showAlert('Please fill out all academic examination records for 10th and 12th standards.', 'Academic Records Required', 'warning');
        track('apply_error', { step: currentStep });
        return false;
      }
    } else if (currentStep === 4) {
      if (!consentConfirmed) {
        showAlert('Please confirm and consent to the academic verification before continuing.', 'Consent Required', 'warning');
        track('apply_error', { step: currentStep });
        return false;
      }
    }
    return true;
  };

  // Funnel analytics: anonymous step events (never form values). Program is only known after step 1.
  useEffect(() => {
    track('apply_step', { action: 'view', step, ...(step > 1 ? { program: formData.programSlug } : {}) });
  }, [step]);

  const nextStep = () => {
    if (validateStep(step)) {
      track('apply_step', { action: 'complete', step, ...(step > 1 ? { program: formData.programSlug } : {}) });
      setStep((prev) => Math.min(5, prev + 1));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

    setLoading(true);
    try {
      const res = await api.submitApplication({
        ...formData,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
      });
      const appData = res;
      setSubmittedApp(appData);
      track('apply_submitted', { program: formData.programSlug });
      if (appData.accessToken) {
        sessionStorage.setItem(`dbs_app_token_${appData.id}`, appData.accessToken);
      }

      // Upload documents if selected
      if (docFiles.marksheet10) {
        const fd = new FormData();
        fd.append('document', docFiles.marksheet10);
        fd.append('documentType', 'MARKSHEET_10');
        await api.uploadApplicantDocument(appData.id, fd, appData.accessToken);
      }
      if (docFiles.marksheet12) {
        const fd = new FormData();
        fd.append('document', docFiles.marksheet12);
        fd.append('documentType', 'MARKSHEET_12');
        await api.uploadApplicantDocument(appData.id, fd, appData.accessToken);
      }
      if (docFiles.photo) {
        const fd = new FormData();
        fd.append('document', docFiles.photo);
        fd.append('documentType', 'PHOTO');
        await api.uploadApplicantDocument(appData.id, fd, appData.accessToken);
      }
      if (docFiles.signature) {
        const fd = new FormData();
        fd.append('document', docFiles.signature);
        fd.append('documentType', 'SIGNATURE');
        await api.uploadApplicantDocument(appData.id, fd, appData.accessToken);
      }

      localStorage.removeItem('dbs_application_draft');

      // Seamlessly open Razorpay payment gateway
      handlePayApplicationFee(appData);
    } catch (err: any) {
      track('apply_error', { step: 5 });
      showAlert(`Submission failed: ${err.message}`, 'Application Submission Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayApplicationFee = async (appOverride?: any) => {
    const currentApp = appOverride || submittedApp;
    if (!currentApp) return;

    try {
      setLoading(true);
      await loadRazorpaySdk();
      if (!window.Razorpay) throw new Error('The payment gateway is unavailable right now. Your application is saved. Please try payment again later.');

      const payableAmount = currentApp.finalFee !== undefined ? currentApp.finalFee : currentAppFee;
      const orderRes = await api.createPaymentOrder({
        amount: payableAmount,
        purpose: 'APPLICATION_FEE',
        applicationId: currentApp.id,
        customerName: currentApp.fullName,
        customerEmail: currentApp.email,
        customerPhone: formData.phone,
        notes: `Application fee for ${currentApp.id}${currentApp.promoCodeUsed ? ` (Promo: ${currentApp.promoCodeUsed})` : ''}`,
      });

        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: 'Deekshaam Business School',
          description: `Application Fee for ${currentApp.id}`,
          order_id: orderRes.orderId,
          handler: async function (response: any) {
            try {
              await api.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              setPaymentSuccess(true);
              track('payment_success', { program: formData.programSlug });
              showToast('Payment verified successfully!');
            } catch (verErr: any) {
              showAlert('Payment signature verification failed: ' + verErr.message, 'Payment Verification Failed', 'error');
            }
          },
          prefill: {
            name: currentApp.fullName,
            email: currentApp.email,
            contact: formData.phone,
          },
          theme: {
            color: '#c2410c',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err: any) {
      showAlert('Payment initialization failed: ' + err.message, 'Payment Gateway Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead canonicalPath="/apply" />

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#17191b',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 999,
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div className="apply-shell">
        <div className="container">
          <div className="apply-head">
            <button
              onClick={() => onNavigate('/')}
              style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              &larr; Back to Home
            </button>
            <div>
              <span className="eyebrow">Online Application 2026-27</span>
              <h1>Deekshaam Undergraduate Application</h1>
              <p>Complete your profile, choose your academic preferences, and submit your application.</p>
            </div>
          </div>

          {!submittedApp ? (
            <div className="application-layout">
              {/* STEP NAVIGATION */}
              <aside className="apply-steps">
                <button className={step === 1 ? 'active' : ''} onClick={() => setStep(1)}>
                  <span>1</span>
                  <div>
                    <strong>Profile</strong>
                    <small>Personal details</small>
                  </div>
                </button>
                <button className={step === 2 ? 'active' : ''} onClick={() => validateStep(1) && setStep(2)}>
                  <span>2</span>
                  <div>
                    <strong>Program</strong>
                    <small>Degree choice</small>
                  </div>
                </button>
                <button className={step === 3 ? 'active' : ''} onClick={() => validateStep(2) && setStep(3)}>
                  <span>3</span>
                  <div>
                    <strong>Academics</strong>
                    <small>Board & marks</small>
                  </div>
                </button>
                <button className={step >= 4 ? 'active' : ''} onClick={() => validateStep(3) && setStep(4)}>
                  <span>4</span>
                  <div>
                    <strong>Review & Docs</strong>
                    <small>Verify & submit</small>
                  </div>
                </button>
              </aside>

              {/* APPLICATION FORM */}
              <form className="apply-form" onSubmit={handleSubmit}>
                {/* STEP 1: PROFILE */}
                {step === 1 && (
                  <div>
                    <span className="eyebrow">Step 1 of 4</span>
                    <h2>Applicant Profile</h2>
                    <div className="form-grid">
                      <label>
                        Full Name (as per 10th marksheet) *
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="e.g. Rahul Sharma"
                          required
                        />
                      </label>
                      <label>
                        Mobile Number *
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          required
                        />
                      </label>
                      <label>
                        Email Address *
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g. rahul@example.com"
                          required
                        />
                      </label>
                      <label>
                        Date of Birth *
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          max={maxDob}
                          min={minDob}
                          required
                        />
                        <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                          Applicants must be at least 14–15 years old.
                        </span>
                      </label>
                      <label>
                        State / UT *
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="e.g. Karnataka"
                          required
                        />
                      </label>
                      <label>
                        City / District *
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. Bangalore"
                          required
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROGRAM */}
                {step === 2 && (
                  <div>
                    <span className="eyebrow">Step 2 of 4</span>
                    <h2>Select Undergraduate Degree</h2>
                    <div className="choice-grid">
                      <label className="choice-card">
                        <input
                          type="radio"
                          name="programSlug"
                          value="bca"
                          checked={formData.programSlug === 'bca'}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>BCA</strong>
                          <small>Bachelor of Computer Applications</small>
                          <em style={{ marginTop: 'auto', fontStyle: 'normal', color: '#666' }}>
                            Software, Data, AI & Cloud
                          </em>
                        </span>
                      </label>

                      <label className="choice-card">
                        <input
                          type="radio"
                          name="programSlug"
                          value="bba"
                          checked={formData.programSlug === 'bba'}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>BBA</strong>
                          <small>Bachelor of Business Administration</small>
                          <em style={{ marginTop: 'auto', fontStyle: 'normal', color: '#666' }}>
                            Management, Digital Business & Analytics
                          </em>
                        </span>
                      </label>

                      <label className="choice-card">
                        <input
                          type="radio"
                          name="programSlug"
                          value="bcom"
                          checked={formData.programSlug === 'bcom'}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>B.Com</strong>
                          <small>Bachelor of Commerce</small>
                          <em style={{ marginTop: 'auto', fontStyle: 'normal', color: '#666' }}>
                            Accounting, Banking & Taxation
                          </em>
                        </span>
                      </label>
                    </div>

                    <label style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      Preferred Specialization (Optional)
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="e.g. AI & ML, Business Analytics, Banking & Insurance"
                      />
                    </label>
                  </div>
                )}

                {/* STEP 3: ACADEMICS */}
                {step === 3 && (
                  <div>
                    <span className="eyebrow">Step 3 of 4</span>
                    <h2>Academic Credentials</h2>
                    <div className="form-grid">
                      <label>
                        Class 10 Board *
                        <input
                          type="text"
                          name="board10"
                          value={formData.board10}
                          onChange={handleChange}
                          placeholder="e.g. CBSE / ICSE / State Board"
                          required
                        />
                      </label>
                      <label>
                        Class 10 Passing Year *
                        <input
                          type="text"
                          name="year10"
                          value={formData.year10}
                          onChange={handleChange}
                          placeholder="e.g. 2022"
                          required
                        />
                      </label>
                      <label>
                        Class 12 / Diploma Board *
                        <input
                          type="text"
                          name="board12"
                          value={formData.board12}
                          onChange={handleChange}
                          placeholder="e.g. Karnataka PU / CBSE / ISC"
                          required
                        />
                      </label>
                      <label>
                        Class 12 Passing Year *
                        <input
                          type="text"
                          name="year12"
                          value={formData.year12}
                          onChange={handleChange}
                          placeholder="e.g. 2024"
                          required
                        />
                      </label>
                      <label>
                        Class 12 Academic Stream *
                        <select name="stream" value={formData.stream} onChange={handleChange} required>
                          <option value="Science">Science (PCM / PCB)</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Humanities / Arts">Humanities / Arts</option>
                          <option value="Diploma">Diploma (Polytechnic)</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label>
                        Aggregate Percentage / CGPA *
                        <input
                          type="text"
                          name="percentage"
                          value={formData.percentage}
                          onChange={handleChange}
                          placeholder="e.g. 84.5%"
                          required
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & DOCUMENT UPLOAD */}
                {step === 4 && (
                  <div>
                    <span className="eyebrow">Step 4 of 4</span>
                    <h2>Review Application & Upload Documents</h2>

                    <div
                      style={{
                        background: '#faf9f7',
                        border: '1px solid var(--line)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                        gap: '12px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <small style={{ color: '#888', textTransform: 'uppercase' }}>Applicant</small>
                        <div style={{ fontWeight: 700 }}>{formData.fullName}</div>
                        <div>{formData.phone}</div>
                        <div>{formData.email}</div>
                      </div>
                      <div>
                        <small style={{ color: '#888', textTransform: 'uppercase' }}>Program</small>
                        <div style={{ fontWeight: 700 }}>{formData.programSlug.toUpperCase()}</div>
                        <div>{formData.specialization || 'General Track'}</div>
                      </div>
                      <div>
                        <small style={{ color: '#888', textTransform: 'uppercase' }}>Academics</small>
                        <div style={{ fontWeight: 700 }}>{formData.stream} &middot; {formData.percentage}</div>
                        <div>Class 12: {formData.board12} ({formData.year12})</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '18px', margin: '20px 0 12px' }}>Upload Verification Documents (PDF or Images)</h3>
                    <div className="form-grid">
                      <label>
                        10th Marks Card
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && setDocFiles((prev) => ({ ...prev, marksheet10: e.target.files![0] }))
                          }
                        />
                      </label>
                      <label>
                        12th Marks Card / Pre-board
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && setDocFiles((prev) => ({ ...prev, marksheet12: e.target.files![0] }))
                          }
                        />
                      </label>
                      <label>
                        Applicant Photograph
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && setDocFiles((prev) => ({ ...prev, photo: e.target.files![0] }))
                          }
                        />
                        {docFiles.photo && (
                          <span style={{ fontSize: '11px', color: '#059669', display: 'block', marginTop: '2px' }}>
                            ✓ {docFiles.photo.name}
                          </span>
                        )}
                      </label>
                      <label>
                        Applicant Signature
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            e.target.files?.[0] && setDocFiles((prev) => ({ ...prev, signature: e.target.files![0] }))
                          }
                        />
                        {docFiles.signature && (
                          <span style={{ fontSize: '11px', color: '#059669', display: 'block', marginTop: '2px' }}>
                            ✓ {docFiles.signature.name}
                          </span>
                        )}
                      </label>
                    </div>

                    <label className="consent" style={{ marginTop: '24px' }}>
                      <input
                        type="checkbox"
                        checked={consentConfirmed}
                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                        required
                      />
                      <span>
                        I confirm that the information submitted above is accurate and true to the best of my knowledge, and
                        I consent to the verification of my submitted academic credentials.
                      </span>
                    </label>
                  </div>
                )}

                {/* STEP 5: SEPARATE REFERRAL & PROMO CODE SECTION (BEFORE PAYMENT) */}
                {step === 5 && (
                  <div>
                    <span className="eyebrow">Fee Concession & Referral</span>
                    <h2>Referral & Promo Code</h2>
                    <p style={{ color: '#555', marginBottom: '20px' }}>
                      If you were referred by an authorized education partner or received an institutional promo code, enter it below to receive your fee concession. You can also skip this step to proceed directly with standard fee payment.
                    </p>

                    {/* PROMO / REFERRAL CODE CARD */}
                    <div
                      style={{
                        padding: '24px',
                        background: appliedPromo ? '#f0fdf4' : '#faf9f7',
                        border: appliedPromo ? '1px solid #86efac' : '1px dashed var(--line)',
                        borderRadius: '12px',
                        marginBottom: '24px',
                      }}
                    >
                      {!appliedPromo ? (
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                            Have a Referral or Promo Code?
                          </label>
                          <div style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
                            <input
                              type="text"
                              placeholder="Enter code (e.g. PD10)"
                              value={promoCodeInput}
                              onChange={(e) => {
                                setPromoCodeInput(e.target.value.toUpperCase());
                                setPromoError(null);
                              }}
                              style={{ textTransform: 'uppercase', flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary small"
                              onClick={() => handleApplyPromo()}
                              disabled={promoLoading || !promoCodeInput.trim()}
                            >
                              {promoLoading ? 'Checking...' : 'Apply Code'}
                            </button>
                          </div>
                          {promoError && (
                            <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0 0' }} role="alert">
                              {promoError}
                            </p>
                          )}

                          {!promoSkipped && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>Don't have a promo code?</span>
                              <button
                                type="button"
                                className="btn btn-ghost small"
                                onClick={() => setPromoSkipped(true)}
                                style={{ color: 'var(--navy-900)', fontWeight: 600 }}
                              >
                                Skip Promo Code &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div aria-live="polite">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                              <Icon name="check" size={20} color="#16a34a" />
                              <span>Promo code <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountPercent}% discount)</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemovePromo}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                            >
                              Remove / Change
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px' }}>
                            <div>Standard Fee: <s style={{ textDecoration: 'line-through', color: '#888' }}>₹{appliedPromo.originalFee || currentAppFee}</s></div>
                            <div>Discount: <span style={{ color: '#16a34a', fontWeight: 700 }}>-₹{appliedPromo.discountAmount}</span></div>
                            <div>Payable: <strong style={{ color: 'var(--navy-900)', fontSize: '15px' }}>₹{appliedPromo.finalFee}</strong></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PAYMENT OPTION: ONLY VISIBLE AFTER USER EITHER ADDS PROMO OR CLICKS SKIP */}
                    {(appliedPromo || promoSkipped) && (
                      <div
                        style={{
                          border: '1px solid #1c3a5e',
                          borderRadius: '16px',
                          padding: '24px',
                          background: '#f8fafc',
                          boxShadow: '0 4px 16px rgba(15, 36, 64, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                              Payment Summary
                            </span>
                            <h3 style={{ margin: '4px 0 6px', fontSize: '20px', color: 'var(--navy-900)' }}>
                              Application Processing Fee
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                              Degree: <strong>{selectedProgram?.title || formData.programSlug.toUpperCase()} ({formData.programSlug.toUpperCase()})</strong>
                              {currentTotalFee > 0 && <span> &middot; Total Degree Fee: <strong>₹{currentTotalFee.toLocaleString('en-IN')}</strong></span>}
                              <br />
                              {appliedPromo ? (
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>Discount applied via code {appliedPromo.code}</span>
                              ) : (
                                <span>Standard application fee (Promo skipped)</span>
                              )}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-900)' }}>
                              ₹{appliedPromo ? appliedPromo.finalFee : currentAppFee}
                            </div>
                            <small style={{ color: '#64748b' }}>INR (Application Fee)</small>
                          </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px 24px', fontSize: '16px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            disabled={loading}
                          >
                            {loading
                              ? 'Submitting & Opening Payment...'
                              : `Proceed to Pay ₹${appliedPromo ? appliedPromo.finalFee : currentAppFee} via Razorpay`} <Icon name="arrow" size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FOOTER CONTROLS */}
                <div className="apply-footer">
                  <button type="button" className="btn btn-ghost" onClick={handleSaveDraft}>
                    Save Draft
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {step > 1 && (
                      <button type="button" className="btn btn-ghost" onClick={prevStep}>
                        Back
                      </button>
                    )}

                    {step < 5 ? (
                      <button type="button" className="btn btn-primary" onClick={nextStep}>
                        Continue <Icon name="arrow" size={16} />
                      </button>
                    ) : (
                      !appliedPromo && !promoSkipped && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => setPromoSkipped(true)}
                        >
                          Skip to Payment <Icon name="arrow" size={16} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* SUBMITTED SUCCESS STATE */
            <div
              className="apply-form"
              style={{
                maxWidth: '680px',
                margin: '0 auto',
                textAlign: 'center',
                padding: '48px 32px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dff6ec',
                  color: 'var(--green)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Icon name="check" size={36} color="var(--green)" />
              </div>
              <span className="eyebrow">Application Successfully Received</span>
              <h2 style={{ fontSize: '32px', margin: '8px 0 16px' }}>Thank you, {submittedApp.fullName}!</h2>
              <p style={{ color: '#555' }}>
                Your online undergraduate application has been recorded in the admissions repository. Please preserve
                your institutional application reference ID below:
              </p>

              <div className="application-id">{submittedApp.id}</div>

              {/* PAYMENT SECTION */}
              <div
                style={{
                  border: '1px solid #e0dcd7',
                  borderRadius: '16px',
                  padding: '24px',
                  margin: '24px 0',
                  background: '#faf9f7',
                }}
              >
                <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Application Processing Fee</h3>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px' }}>
                  Amount Payable Now:{' '}
                  <strong>₹{(submittedApp.finalFee !== undefined ? submittedApp.finalFee : currentAppFee).toFixed(2)} INR</strong>{' '}
                  {submittedApp.discountAmount > 0 && (
                    <span style={{ color: '#16a34a', marginLeft: '6px' }}>
                      (Includes {submittedApp.discountPercentApplied}% discount via code {submittedApp.promoCodeUsed})
                    </span>
                  )}
                </p>
                {submittedApp.totalCourseFee > 0 && (
                  <p style={{ fontSize: '13px', color: '#555', margin: '0 0 16px' }}>
                    Total Program / Tuition Fee: <strong>₹{submittedApp.totalCourseFee.toLocaleString('en-IN')} INR</strong>
                  </p>
                )}

                {paymentSuccess ? (
                  <div
                    style={{
                      background: '#dff6ec',
                      color: 'var(--green)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon name="check" size={18} color="var(--green)" /> Application Fee Paid & Verified
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => handlePayApplicationFee()} disabled={loading}>
                    {loading
                      ? 'Processing...'
                      : `Pay Application Fee via Razorpay (₹${submittedApp.finalFee !== undefined ? submittedApp.finalFee : currentAppFee})`}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => onNavigate(`/track?id=${submittedApp.id}`)}>
                  Track Application Status <Icon name="arrow" size={16} />
                </button>
                <button className="btn btn-ghost" onClick={() => onNavigate('/')}>
                  Return to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalConfig && (
        <NotificationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      )}
    </>
  );
};
