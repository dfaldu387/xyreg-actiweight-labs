import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataRooms } from '@/hooks/useDataRooms';
import { DataRoom } from '@/types/dataRoom';
import { DataRoomContentSelector as GeneratedContentSelector } from '@/components/investor-data-room/DataRoomContentSelector';
import { DataRoomContentSelector } from './DataRoomContentSelector';
import { InvestorAccessManager } from './InvestorAccessManager';
import { ProductMultiSelector } from './ProductMultiSelector';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface DataRoomWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  dataRoom?: DataRoom | null;
}

export function DataRoomWizard({ open, onOpenChange, companyId, dataRoom }: DataRoomWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessStartDate, setAccessStartDate] = useState('');
  const [accessEndDate, setAccessEndDate] = useState('');
  const [currentDataRoomId, setCurrentDataRoomId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const { lang } = useTranslation();
  const { createDataRoom, updateDataRoom, isCreating, isUpdating } = useDataRooms(companyId);

  // Fetch products for company
  useEffect(() => {
    if (open && companyId) {
      supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name')
        .then(({ data }) => {
          if (data) {
            setProducts(data);
          }
        });
    }
  }, [open, companyId]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Load existing data room if editing
  useEffect(() => {
    if (dataRoom) {
      setName(dataRoom.name);
      setDescription(dataRoom.description || '');
      setAccessStartDate(dataRoom.access_start_date || '');
      setAccessEndDate(dataRoom.access_end_date || '');
      setCurrentDataRoomId(dataRoom.id);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setAccessStartDate('');
      setAccessEndDate('');
      setCurrentDataRoomId(null);
      setStep(1);
    }
  }, [dataRoom, open]);

  const handleSaveEdit = () => {
    if (!dataRoom) return;
    
    updateDataRoom(
      {
        id: dataRoom.id,
        input: { 
          name, 
          description, 
          access_start_date: accessStartDate,
          access_end_date: accessEndDate 
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      // Create new data room
      createDataRoom(
        {
          companyId,
          input: { 
            name, 
            description, 
            access_start_date: accessStartDate,
            access_end_date: accessEndDate 
          },
        },
        {
          onSuccess: (newRoom) => {
            setCurrentDataRoomId(newRoom.id);
            setStep(2);
          },
        }
      );
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setName('');
      setDescription('');
      setAccessStartDate('');
      setAccessEndDate('');
      setCurrentDataRoomId(null);
      setSelectedProductIds([]);
    }, 200);
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dataRoom ? lang('commercial.investors.wizard.editTitle') : lang('commercial.investors.wizard.createTitle')}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{lang('commercial.investors.wizard.stepOf').replace('{{current}}', String(step)).replace('{{total}}', String(totalSteps))}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {dataRoom ? lang('commercial.investors.wizard.editBasicInfo') : lang('commercial.investors.wizard.basicInfo')}
              </h3>

              <div className="space-y-2">
                <Label>{lang('commercial.investors.wizard.selectProducts')}</Label>
                <ProductMultiSelector
                  products={products}
                  selectedProductIds={selectedProductIds}
                  onChange={setSelectedProductIds}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{lang('commercial.investors.wizard.dataRoomName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang('commercial.investors.wizard.dataRoomNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{lang('commercial.investors.wizard.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang('commercial.investors.wizard.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">{lang('commercial.investors.wizard.accessStartDate')}</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={accessStartDate}
                    max={accessEndDate || undefined}
                    onChange={(e) => setAccessStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">{lang('commercial.investors.wizard.accessEndDate')}</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={accessEndDate}
                    min={accessStartDate || undefined}
                    onChange={(e) => setAccessEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && currentDataRoomId && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">{lang('commercial.investors.wizard.addContent')}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedProductIds.length > 0
                  ? lang('commercial.investors.wizard.contentWithProducts')
                  : lang('commercial.investors.wizard.contentManual')
                }
              </p>

              {/* Auto-generated content section */}
              {selectedProductIds.length > 0 && (
                <GeneratedContentSelector
                  dataRoomId={currentDataRoomId}
                  productIds={selectedProductIds}
                />
              )}

              {/* Manual upload section */}
              <div>
                <h4 className="text-md font-semibold mb-3">
                  {selectedProductIds.length > 0 ? lang('commercial.investors.wizard.uploadCustom') : lang('commercial.investors.wizard.uploadDocuments')}
                </h4>
                <DataRoomContentSelector
                  dataRoomId={currentDataRoomId}
                />
              </div>
            </div>
          )}

          {step === 3 && currentDataRoomId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{lang('commercial.investors.wizard.inviteInvestors')}</h3>
              <p className="text-sm text-muted-foreground">
                {lang('commercial.investors.wizard.inviteDescription')}
              </p>
              <InvestorAccessManager dataRoomId={currentDataRoomId} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          {!dataRoom && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {lang('commercial.investors.wizard.back')}
            </Button>
          )}

          <div className={`flex gap-2 ${dataRoom ? 'w-full justify-end' : ''}`}>
            <Button variant="outline" onClick={handleClose}>
              {lang('commercial.investors.wizard.cancel')}
            </Button>

            {dataRoom ? (
              <Button
                onClick={handleSaveEdit}
                disabled={!canProceed() || isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? lang('commercial.investors.wizard.saving') : lang('commercial.investors.wizard.saveChanges')}
              </Button>
            ) : step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isCreating}
              >
                {isCreating ? lang('commercial.investors.wizard.creating') : lang('commercial.investors.wizard.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleClose}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {lang('commercial.investors.wizard.done')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
