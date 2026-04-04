
import { AlertTriangle } from "lucide-react";
import { Product } from "@/types/client";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductAlertsProps {
  product: Product;
  onAlertClick?: (type: "document" | "audit" | "certification", name: string) => void;
}

export function ProductAlerts({ product, onAlertClick }: ProductAlertsProps) {
  const generateAlerts = (product: Product) => {
    const alerts: {
      text: string;
      type: "document" | "audit" | "certification";
      name: string;
      dueDate?: string;
    }[] = [];

    // Check if certifications exist before trying to iterate
    if (product.certifications && product.certifications.length > 0) {
      product.certifications.forEach(cert => {
        if (cert.status === "Expiring") {
          alerts.push({
            text: `Certification ${cert.name} is expiring on ${cert.expiryDate}`,
            type: "certification",
            name: cert.name,
          });
        }
      });
    }

    // Check if documents exist before trying to iterate
    if (product.documents && product.documents.length > 0) {
      product.documents.forEach(doc => {
        if (doc.status === "Overdue") {
          alerts.push({
            text: `Document ${doc.name} is overdue${doc.dueDate ? ` (Due: ${doc.dueDate})` : ''}`,
            type: "document",
            name: doc.name,
            dueDate: doc.dueDate,
          });
        }
      });
    }

    // Check if audits exist before trying to iterate
    if (product.audits && product.audits.length > 0) {
      product.audits.forEach(audit => {
        if (audit.status === "Unscheduled") {
          alerts.push({
            text: `Audit ${audit.name} needs to be scheduled`,
            type: "audit",
            name: audit.name,
          });
        }
      });
    }

    return alerts;
  };

  const alerts = generateAlerts(product);

  if (alerts.length === 0) return null;

  const handleAlertClick = (type: "document" | "audit" | "certification", name: string) => {
    console.log(`Alert clicked: ${type} - ${name}`);
    if (onAlertClick) {
      onAlertClick(type, name);
    } else {
      // Fallback direct navigation if no click handler is provided
      let targetId;
      
      if (type === "document") {
        targetId = "documents-section";
      } else if (type === "audit") {
        targetId = "audits-section";
      } else if (type === "certification") {
        targetId = "certifications-section";
      }
      
      if (targetId) {
        console.log(`Scrolling to ${targetId}`);
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            element.focus();
            element.classList.add("bg-primary/5");
            setTimeout(() => {
              element.classList.remove("bg-primary/5");
            }, 2000);
          }, 100);
        } else {
          console.log(`Element with ID ${targetId} not found`);
        }
      }
    }
  };

  return (
    <div className="bg-warning/10 p-4 rounded-lg space-y-2">
      {alerts.map((alert, index) => (
        <button
          key={index}
          type="button"
          className="flex items-center gap-2 text-warning w-full text-left focus:outline-none rounded transition hover:bg-warning/20 active:bg-warning/30 px-2 py-1"
          style={{ background: "none", border: "none" }}
          tabIndex={0}
          onClick={() => handleAlertClick(alert.type, alert.name)}
          aria-label={`Go to ${alert.type} "${alert.name}"`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{alert.text}</span>
        </button>
      ))}
    </div>
  );
}
