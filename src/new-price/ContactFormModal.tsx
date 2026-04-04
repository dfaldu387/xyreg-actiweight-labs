
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ContactForm from './ContactForm';

type Tier = 'genesis' | 'core' | 'enterprise' | 'investor';

interface ContactFormModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  tier?: Tier;
}

const modalConfig: Record<Tier, { title: string; description: string; submitLabel: string; successMessage: string }> = {
  genesis: {
    title: "Create Your Free Account",
    description: "Get started with Xyreg Genesis - no credit card required.",
    submitLabel: "Continue",
    successMessage: "Your Genesis account is being created..."
  },
  core: {
    title: "Start Your 14-Day Trial",
    description: "Begin your Helix OS trial. We'll reach out within 24 hours to activate your account.",
    submitLabel: "Start Trial",
    successMessage: "Your trial request has been submitted! We'll activate your Helix OS trial and contact you within 24 hours."
  },
  enterprise: {
    title: "Request Sales Consultation",
    description: "Our team will contact you to discuss your enterprise requirements.",
    submitLabel: "Request Consultation",
    successMessage: "Thank you for your interest! Our enterprise team will contact you within 24 hours."
  },
  investor: {
    title: "Join the Investor Network",
    description: "Register to access deal flow, due diligence tools, and portfolio monitoring.",
    submitLabel: "Join Network",
    successMessage: "Welcome to the Xyreg Investor Network! We'll contact you within 24 hours to complete your registration."
  }
};

const ContactFormModal = ({ children, isOpen, onClose, tier = 'core' }: ContactFormModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      if (!newOpen && onClose) {
        onClose();
      }
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSuccess = () => {
    handleOpenChange(false);
  };

  const config = modalConfig[tier];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          onSuccess={handleSuccess}
          submitLabel={config.submitLabel}
          successMessage={config.successMessage}
          tier={tier}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;
