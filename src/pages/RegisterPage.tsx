import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Building2, Users, UserRound, Lock } from 'lucide-react';
import { IndividualForm } from '../components/registration/IndividualForm';
import { InstitutionalForm } from '../components/registration/InstitutionalForm';
import { RegistrationSuccess } from '../components/registration/RegistrationSuccess';
import { useRegistration } from '../context/RegistrationContext';
import type { RegistrationResult } from '../utils/registrationApi';

type Step = 'type' | 'delegation' | 'individual' | 'institutional' | 'success';
type Delegation = 'SINGLE' | 'DOUBLE';

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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, scale: 1.015 }}
    className="group glass gold-border gold-border-hover rounded-md p-7 text-left flex flex-col gap-4 h-full"
  >
    <div className="w-12 h-12 flex items-center justify-center border border-comun-gold/25 rounded-sm text-comun-gold group-hover:border-comun-gold/50 transition-colors">
      {icon}
    </div>
    <h3 className="font-serif-display text-2xl text-comun-white group-hover:text-gold-gradient transition-all">{title}</h3>
    <p className="font-sans text-sm text-comun-muted leading-relaxed">{description}</p>
    <span className="mt-auto pt-2 font-sans text-xs tracking-widest uppercase text-comun-gold/70 group-hover:text-comun-gold transition-colors">
      Continue →
    </span>
  </motion.button>
);

const RegisterPage: React.FC = () => {
  const { isOpen } = useRegistration();
  const [step, setStep] = useState<Step>('type');
  const [delegation, setDelegation] = useState<Delegation>('SINGLE');
  const [result, setResult] = useState<{ data: RegistrationResult; phone: string } | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const onSuccess = (data: RegistrationResult, phone: string) => {
    setResult({ data, phone });
    setDuplicateId(null);
    setStep('success');
    window.scrollTo({ top: 0 });
  };
  const onDuplicate = (applicationId: string) => {
    setDuplicateId(applicationId);
    window.scrollTo({ top: 0 });
  };

  const back = () => {
    setDuplicateId(null);
    if (step === 'delegation') setStep('type');
    else if (step === 'individual') setStep('delegation');
    else if (step === 'institutional') setStep('type');
  };

  return (
    <main className="relative min-h-screen pt-28 md:pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-comun-gold/80">Registration</span>
          <h1 className="font-serif-display text-4xl md:text-5xl font-semibold text-gold-gradient mt-3 mb-3">Register for CoMUN 2026</h1>
          <div className="gold-divider" />
        </div>

        {/* Back button */}
        {step !== 'type' && step !== 'success' && (
          <button onClick={back} className="mb-6 inline-flex items-center gap-2 font-sans text-sm text-comun-muted hover:text-comun-gold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* Registrations closed */}
        {!isOpen ? (
          <div className="glass-navy gold-border rounded-md max-w-lg mx-auto p-8 text-center">
            <div className="mx-auto mb-5 w-14 h-14 flex items-center justify-center rounded-full border border-comun-gold/30 bg-comun-gold/5">
              <Lock className="w-6 h-6 text-comun-gold" />
            </div>
            <h2 className="font-serif-display text-2xl font-semibold text-gold-gradient mb-3">Registrations Closed</h2>
            <p className="font-sans text-sm text-comun-muted mb-6">Registrations for CoMUN 2026 are currently closed. Please check back soon.</p>
            <Link to="/" className="btn-primary text-sm px-7 py-3">Back to Home</Link>
          </div>
        ) : duplicateId ? (
          <DuplicateNotice applicationId={duplicateId} onDismiss={() => setDuplicateId(null)} />
        ) : step === 'success' && result ? (
          <RegistrationSuccess result={result.data} phone={result.phone} />
        ) : step === 'type' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ChoiceCard index={0} icon={<User className="w-6 h-6" />} title="Individual Registration" description="Register on your own as a delegate — choose single or double delegation." onClick={() => setStep('delegation')} />
            <ChoiceCard index={1} icon={<Building2 className="w-6 h-6" />} title="Institutional Registration" description="Register a school delegation of multiple delegates under a faculty advisor." onClick={() => setStep('institutional')} />
          </div>
        ) : step === 'delegation' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ChoiceCard index={0} icon={<UserRound className="w-6 h-6" />} title="Single Delegation" description="Represent one portfolio in a committee of your choice." onClick={() => { setDelegation('SINGLE'); setStep('individual'); }} />
            <ChoiceCard index={1} icon={<Users className="w-6 h-6" />} title="Double Delegation" description="Two delegates share one portfolio — available for DISEC only." onClick={() => { setDelegation('DOUBLE'); setStep('individual'); }} />
          </div>
        ) : step === 'individual' ? (
          <IndividualForm delegationType={delegation} onSuccess={onSuccess} onDuplicate={onDuplicate} />
        ) : step === 'institutional' ? (
          <InstitutionalForm onSuccess={onSuccess} onDuplicate={onDuplicate} />
        ) : null}
      </div>
    </main>
  );
};

const DuplicateNotice: React.FC<{ applicationId: string; onDismiss: () => void }> = ({ applicationId, onDismiss }) => (
  <div className="glass-navy gold-border rounded-md max-w-lg mx-auto p-8 text-center">
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
  </div>
);

export default RegisterPage;
