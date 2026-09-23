import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

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

  const [docFiles, setDocFiles] = useState<{
    marksheet10?: File;
    marksheet12?: File;
    photo?: File;
  }>({});

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

    // Check query params for pre-selected program
    const params = new URLSearchParams(window.location.search);
    const prog = params.get('program');
    if (prog) {
      setFormData((prev) => ({ ...prev, programSlug: prog }));
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
        alert('Please fill out all personal profile fields.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.programSlug) {
        alert('Please select your preferred undergraduate degree program.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.board10 || !formData.year10 || !formData.board12 || !formData.year12 || !formData.percentage) {
        alert('Please fill out all academic examination records.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const res = await api.submitApplication(formData);
      const appData = res;
      setSubmittedApp(appData);
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

      localStorage.removeItem('dbs_application_draft');
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayApplicationFee = async () => {
    if (!submittedApp) return;

    try {
      setLoading(true);
      await loadRazorpaySdk();

      const orderRes = await api.createPaymentOrder({
        amount: 500, // 500 INR
        purpose: 'APPLICATION_FEE',
        applicationId: submittedApp.id,
        customerName: submittedApp.fullName,
        customerEmail: submittedApp.email,
        customerPhone: formData.phone,
        notes: `Application fee for ${submittedApp.id}`,
      });

      if (window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: 'Deekshaam Business School',
          description: `Application Fee for ${submittedApp.id}`,
          order_id: orderRes.orderId,
          handler: async function (response: any) {
            try {
              await api.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              setPaymentSuccess(true);
              showToast('Payment verified successfully!');
            } catch (verErr: any) {
              alert('Payment signature verification failed: ' + verErr.message);
            }
          },
          prefill: {
            name: submittedApp.fullName,
            email: submittedApp.email,
            contact: formData.phone,
          },
          theme: {
            color: '#c2410c',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Mock fallback if Razorpay JS SDK is not loaded in offline mode
        const mockPaymentId = `pay_mock_${Date.now()}`;
        await api.verifyPayment({
          orderId: orderRes.orderId,
          paymentId: mockPaymentId,
          signature: 'mock_signature_verified',
        });
        setPaymentSuccess(true);
        showToast('Application fee payment recorded (Test Mode)!');
      }
    } catch (err: any) {
      alert('Payment initialization failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Online Application Portal"
        description="Submit your undergraduate application online for BBA, BCA, or B.Com at Deekshaam Business School."
        canonicalPath="/apply"
      />

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
                <button className={step === 4 ? 'active' : ''} onClick={() => validateStep(3) && setStep(4)}>
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
                          required
                        />
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
                        gridTemplateColumns: 'repeat(3, 1fr)',
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
                      </label>
                    </div>

                    <label className="consent" style={{ marginTop: '24px' }}>
                      <input type="checkbox" required />
                      <span>
                        I confirm that the information submitted above is accurate and true to the best of my knowledge, and
                        I consent to the verification of my submitted academic credentials.
                      </span>
                    </label>
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

                    {step < 4 ? (
                      <button type="button" className="btn btn-primary" onClick={nextStep}>
                        Continue <Icon name="arrow" size={16} />
                      </button>
                    ) : (
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Application'} <Icon name="arrow" size={16} />
                      </button>
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
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px' }}>
                  Amount: <strong>₹500.00 INR</strong> (Standard non-refundable processing fee via Razorpay)
                </p>

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
                  <button className="btn btn-primary" onClick={handlePayApplicationFee} disabled={loading}>
                    {loading ? 'Processing...' : 'Pay Application Fee via Razorpay (₹500)'}
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
    </>
  );
};
