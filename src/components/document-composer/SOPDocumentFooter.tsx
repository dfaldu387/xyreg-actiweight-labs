import React from 'react';
import { RevisionHistory, AssociatedDocument } from '@/types/documentComposer';
import { format } from 'date-fns';

interface SOPDocumentFooterProps {
  revisionHistory?: RevisionHistory[];
  associatedDocuments?: AssociatedDocument[];
  sopNumber?: string;
  version?: string;
  className?: string;
}

export function SOPDocumentFooter({ 
  revisionHistory, 
  associatedDocuments, 
  sopNumber, 
  version,
  className = '' 
}: SOPDocumentFooterProps) {
  return (
    <div className={`bg-white border-t-2 border-gray-300 mt-8 ${className}`}>
      {/* Revision History */}
      {revisionHistory && revisionHistory.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-sm mb-3 text-gray-800">Revision History</h3>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Version</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Date</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Description</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Changed By</th>
              </tr>
            </thead>
            <tbody>
              {revisionHistory.map((revision, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-2 py-1">{revision.version}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {revision.date ? (() => { try { const d = revision.date instanceof Date ? revision.date : new Date(revision.date); return isNaN(d.getTime()) ? 'Not set' : format(d, 'dd/MM/yyyy'); } catch { return 'Not set'; } })() : 'Not set'}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">{revision.description}</td>
                  <td className="border border-gray-300 px-2 py-1">{revision.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Associated Documents */}
      {associatedDocuments && associatedDocuments.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-sm mb-3 text-gray-800">Associated Documents</h3>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Document Title</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Document Number</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {associatedDocuments.map((doc, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-2 py-1">{doc.title}</td>
                  <td className="border border-gray-300 px-2 py-1">{doc.documentNumber}</td>
                  <td className="border border-gray-300 px-2 py-1">{doc.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with document info */}
      <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">
        {sopNumber && version && (
          <div>Document: {sopNumber} | Version: {version} | Page 1 of 1</div>
        )}
      </div>
    </div>
  );
}