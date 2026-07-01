import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Building2, Users, UserRound, Lock, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import { IndividualForm } from '../components/registration/IndividualForm';
import { InstitutionalForm } from '../components/registration/InstitutionalForm';
import { RegistrationSuccess } from '../components/registration/RegistrationSuccess';
import { useRegistration } from '../context/RegistrationContext';
import type { RegistrationResult } from '../utils/registrationApi';

type Step = 'type' | 'delegation' | 'individual' | 'inst-template' | 'institutional' | 'success';
type Delegation = 'SINGLE' | 'DOUBLE';

// ─── Institutional spreadsheet template URL (served from publicDir) ───────────────
const TEMPLATE_URL = '/Institution%20Delegation%20Registration%20Spreadsheet%20Template.xlsx';

// ─── Step breadcrumb config ────────────────────────────────────────────────
const STEP_LABELS: Partial<Record<Step, string>> = {
  type:            'Choose Type',
  delegation:      'Delegation',
  'inst-template': 'Download Template',
  individual:      'Details',
  institutional:   'Details',
};

const STEPS_INDIVIDUAL    = ['type', 'delegation', 'individual'];
const STEPS_INSTITUTIONAL = ['type', 'inst-template', 'institutional'];

// ─── Choice Card ──────────────────────────────────────────────────────────
interface ChoiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  index: number;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ icon, title, description, onClick, index }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -5, scale: 1.015 }}
    className="group relative text-left flex flex-col gap-5 p-7 rounded-md overflow-hidden
      border border-comun-gold/15 bg-white/[0.03]
      hover:border-comun-gold/55 hover:bg-gradient-to-br hover:from-comun-gold/8 hover:to-comun-gold-dark/3
      transition-all duration-300"
    style={{ backdropFilter: 'blur(12px)' }}
  >
    {/* Gold top accent line — appears on hover */}
    <div className="absolute top-0 left-0 right-0 h-0.5
      bg-gradient-to-r from-comun-gold-dark via-comun-gold to-comun-gold-dark
      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Gold glow overlay — appears on hover */}
    <div className="absolute inset-0 pointer-events-none rounded-md
      opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ boxShadow: 'inset 0 0 40px rgba(255,208,0,0.06), 0 0 30px rgba(255,208,0,0.12)' }}
    />

    {/* Corner ornament */}
    <div className="absolute top-4 right-4 w-7 h-7 border-t border-r border-comun-gold/20 group-hover:border-comun-gold/55 transition-colors duration-300" />

    {/* Icon */}
    <div className="w-12 h-12 flex items-center justify-center border border-comun-gold/25 rounded-sm text-comun-gold group-hover:border-comun-gold/70 group-hover:bg-comun-gold/5 transition-all duration-300">
      {icon}
    </div>

    {/* Text */}
    <div className="flex-1">
      <h3 className="font-serif-display text-2xl text-comun-white group-hover:text-gold-gradient transition-all duration-300 mb-2">
        {title}
      </h3>
      <p className="font-sans text-sm text-comun-muted leading-relaxed">{description}</p>
    </div>

    {/* CTA row */}
    <div className="flex items-center justify-between pt-4 border-t border-comun-gold/10 group-hover:border-comun-gold/25 transition-colors duration-300">
      <span className="font-sans text-xs tracking-widest uppercase text-comun-gold/60 group-hover:text-comun-gold transition-colors">
        Select
      </span>
      <ChevronRight className="w-4 h-4 text-comun-gold/50 group-hover:text-comun-gold group-hover:translate-x-1 transition-all duration-200" />
    </div>
  </motion.button>
);

// ─── Progress Steps ────────────────────────────────────────────────────────
const StepBar: React.FC<{ steps: string[]; current: string }> = ({ steps, current }) => {
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans border transition-all duration-400 ${
                done   ? 'bg-comun-gold border-comun-gold text-comun-black'  :
                active ? 'border-comun-gold text-comun-gold bg-comun-gold/10' :
                         'border-white/15 text-comun-muted bg-transparent'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`font-sans text-[10px] tracking-wider uppercase hidden sm:block ${
                active ? 'text-comun-gold' : done ? 'text-comun-gold/60' : 'text-comun-muted'
              }`}>
                {STEP_LABELS[s as Step] || s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-400 ${done ? 'bg-comun-gold/60' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Duplicate Notice ──────────────────────────────────────────────────────
const DuplicateNotice: React.FC<{ applicationId: string; onDismiss: () => void }> = ({ applicationId, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-navy gold-border rounded-md max-w-lg mx-auto p-8 text-center"
  >
    <h2 className="font-serif-display text-2xl font-semibold text-gold-gradient mb-3">Already Registered</h2>
    <p className="font-sans text-sm text-comun-muted mb-4">
      A registration already exists for these details. Your Application ID is:
    </p>
    <div className="px-5 py-3 border border-comun-gold/30 bg-comun-gold/5 rounded-sm inline-block mb-5">
      <span className="font-serif-display text-2xl font-semibold text-comun-gold tracking-wider">{applicationId}</span>
    </div>
    <p className="font-sans text-xs text-comun-muted mb-6">
      If you believe this is a mistake, please contact the organizers.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link to="/retrieve" className="btn-primary text-sm px-7 py-3">Retrieve Registration</Link>
      <button onClick={onDismiss} className="btn-secondary text-sm px-7 py-3">Try Again</button>
    </div>
  </motion.div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────
const RegisterPage: React.FC = () => {
  const { isOpen } = useRegistration();
  const [searchParams] = useSearchParams();

  // If a ?flow= param was passed from the homepage, jump directly to that flow
  const initialFlow = searchParams.get('flow') as 'individual' | 'institutional' | null;
  const [step, setStep]       = useState<Step>(() => {
    if (initialFlow === 'individual')    return 'delegation';
    if (initialFlow === 'institutional') return 'institutional';
    return 'type';
  });
  const [delegation, setDelegation] = useState<Delegation>('SINGLE');
  const [result, setResult]   = useState<{ data: RegistrationResult; phone: string } | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  // Determine which flow we're in based on step history
  const [flowType, setFlowType] = useState<'individual' | 'institutional'>(
    initialFlow === 'institutional' ? 'institutional' : 'individual',
  );
  const activeSteps = flowType === 'institutional' ? STEPS_INSTITUTIONAL : STEPS_INDIVIDUAL;

  const onSuccess = (data: RegistrationResult, phone: string) => {
    setResult({ data, phone });
    setDuplicateId(null);
    setStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDuplicate = (applicationId: string) => {
    setDuplicateId(applicationId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setDuplicateId(null);
    if (step === 'delegation') setStep('type');
    else if (step === 'individual') setStep('delegation');
    else if (step === 'inst-template') setStep('type');
    else if (step === 'institutional') setStep('inst-template');
  };

  const showStepBar = isOpen && !duplicateId && step !== 'success';

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ── Decorative background (same as homepage body) ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        {/* Ambient gold glow top-center */}
        <div style={{
          position: 'absolute', top: '-8%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', height: '55vh',
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }} />
        {/* Teal glow bottom-right */}
        <div style={{
          position: 'absolute', bottom: '10%', right: '-5%',
          width: '40vw', height: '40vh',
          background: 'radial-gradient(ellipse at center, rgba(91,184,212,0.05) 0%, transparent 70%)',
        }} />
        {/* Subtle grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-comun-gold/50" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.3em] uppercase text-comun-gold/80">
              CoMUN 2026 · Registration
            </span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-comun-gold/50" />
          </div>

          <h1 className="font-serif-display text-4xl md:text-5xl font-semibold text-gold-gradient mb-4">
            {step === 'success' ? 'Registration Confirmed' : 'Register for CoMUN 2026'}
          </h1>

          {step !== 'success' && (
            <p className="font-sans text-sm text-comun-muted max-w-xl mx-auto">
              Join the premier diplomatic simulation at Cottons Campus —{' '}
              <span className="text-comun-gold/80">30 July – 1 August 2026</span>
            </p>
          )}

          {/* gold divider */}
          <motion.div
            className="mx-auto mt-5"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="gold-divider" />
          </motion.div>
        </motion.div>

        {/* Step progress bar */}
        <AnimatePresence>
          {showStepBar && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <StepBar steps={activeSteps} current={step} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        <AnimatePresence>
          {step !== 'type' && step !== 'success' && !duplicateId && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-sans text-sm text-comun-muted hover:text-comun-gold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content Panels ── */}
        <AnimatePresence mode="wait">

          {/* Registrations Closed */}
          {!isOpen ? (
            <motion.div
              key="closed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-navy gold-border rounded-md max-w-lg mx-auto p-10 text-center"
            >
              <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full border border-comun-gold/30 bg-comun-gold/5">
                <Lock className="w-7 h-7 text-comun-gold" />
              </div>
              <h2 className="font-serif-display text-2xl font-semibold text-gold-gradient mb-3">Registrations Closed</h2>
              <p className="font-sans text-sm text-comun-muted mb-8">
                Registrations for CoMUN 2026 are currently closed. Please check back soon or follow our official channels for updates.
              </p>
              <Link to="/" className="btn-primary text-sm px-8 py-3">Back to Home</Link>
            </motion.div>

          ) : duplicateId ? (
            <motion.div key="duplicate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DuplicateNotice applicationId={duplicateId} onDismiss={() => setDuplicateId(null)} />
            </motion.div>

          ) : step === 'success' && result ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RegistrationSuccess result={result.data} phone={result.phone} />
            </motion.div>

          ) : step === 'type' ? (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ChoiceCard
                  index={0}
                  icon={<User className="w-6 h-6" />}
                  title="Individual Registration"
                  description="Register on your own as a delegate — choose single or double delegation in your preferred committee."
                  onClick={() => { setFlowType('individual'); setStep('delegation'); }}
                />
                <ChoiceCard
                  index={1}
                  icon={<Building2 className="w-6 h-6" />}
                  title="Institutional Registration"
                  description="Register a school or college delegation of multiple delegates under a faculty advisor."
                  onClick={() => { setFlowType('institutional'); setStep('inst-template'); }}
                />
              </div>

              {/* Info strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 p-4 border border-comun-gold/10 bg-comun-gold/[0.03] rounded-sm text-center"
              >
                <p className="font-sans text-xs text-comun-muted">
                  Already registered?{' '}
                  <Link to="/retrieve" className="text-comun-gold hover:underline underline-offset-2">
                    Retrieve your registration →
                  </Link>
                </p>
              </motion.div>
            </motion.div>

          ) : step === 'delegation' ? (
            <motion.div
              key="delegation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ChoiceCard
                  index={0}
                  icon={<UserRound className="w-6 h-6" />}
                  title="Single Delegation"
                  description="Represent one portfolio in a committee of your choice. Open to all committees."
                  onClick={() => { setDelegation('SINGLE'); setStep('individual'); }}
                />
                <ChoiceCard
                  index={1}
                  icon={<Users className="w-6 h-6" />}
                  title="Double Delegation"
                  description="Two delegates share one portfolio together — available exclusively for DISEC."
                  onClick={() => { setDelegation('DOUBLE'); setStep('individual'); }}
                />
              </div>
            </motion.div>

          ) : step === 'individual' ? (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <IndividualForm
                delegationType={delegation}
                onSuccess={onSuccess}
                onDuplicate={onDuplicate}
              />
            </motion.div>

          ) : step === 'inst-template' ? (
            <motion.div
              key="inst-template"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col gap-6"
            >
              {/* Header */}
              <div className="text-center">
                <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-2">Step 1 of 2</p>
                <h2 className="font-serif-display text-2xl md:text-3xl text-comun-white mb-3">Download Delegation Template</h2>
                <p className="font-sans text-sm text-comun-muted max-w-lg mx-auto leading-relaxed">
                  Before filling the registration form, download and complete the official delegation spreadsheet template.
                  You will need to upload the filled file during registration.
                </p>
              </div>

              {/* Template card */}
              <div className="border border-comun-gold/25 bg-comun-gold/[0.04] rounded-md p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-14 h-14 flex items-center justify-center bg-comun-gold/10 border border-comun-gold/25 rounded-sm flex-shrink-0">
                  <FileSpreadsheet className="w-7 h-7 text-comun-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Required Template</p>
                  <h3 className="font-sans font-semibold text-comun-white text-base mb-1">Institution Delegation Registration Spreadsheet</h3>
                  <p className="font-sans text-sm text-comun-muted">
                    Fill in all delegate details for your institution — name, grade, experience, committee preference, etc.
                    Upload the completed file in the next step.
                  </p>
                </div>
                <a
                  href={TEMPLATE_URL}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-comun-gold text-comun-black font-sans font-bold text-sm rounded-sm hover:bg-comun-gold-light transition-colors flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </a>
              </div>

              {/* Instructions */}
              <div className="border border-white/8 bg-white/[0.02] rounded-md p-5">
                <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-3">Instructions</p>
                <ol className="font-sans text-sm text-comun-muted space-y-2 list-decimal list-inside">
                  <li>Download the Excel template above.</li>
                  <li>Fill in the details for <strong className="text-comun-white/80">each delegate</strong> from your institution.</li>
                  <li>Save the filled file — you will upload it in the next step.</li>
                  <li>Proceed to fill in your teacher and head delegate contact information.</li>
                </ol>
              </div>

              {/* Continue button */}
              <button
                onClick={() => setStep('institutional')}
                className="btn-primary py-3.5 text-sm w-full sm:w-auto sm:self-end"
              >
                I've Downloaded the Template — Continue to Registration →
              </button>
            </motion.div>

          ) : step === 'institutional' ? (
            <motion.div
              key="institutional"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <InstitutionalForm onSuccess={onSuccess} onDuplicate={onDuplicate} />
            </motion.div>

          ) : null}

        </AnimatePresence>
      </div>
    </main>
  );
};

export default RegisterPage;
