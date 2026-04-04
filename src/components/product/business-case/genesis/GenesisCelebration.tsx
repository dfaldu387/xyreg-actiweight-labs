import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, Presentation } from 'lucide-react';

interface GenesisCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalSteps: number;
  productId?: string;
  onShareWithInvestors?: () => void;
}

export function GenesisCelebration({
  open,
  onOpenChange,
  totalSteps,
  productId,
  onShareWithInvestors
}: GenesisCelebrationProps) {
  const navigate = useNavigate();
  const [particlesInit, setParticlesInit] = useState(false);

  // Initialize particles engine with confetti preset
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadConfettiPreset(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  // Confetti preset options - 4 corners flowing toward center dialog
  const confettiOptions = {
    preset: "confetti",
    fullScreen: { enable: true, zIndex: 100 },
    particles: {
      color: {
        value: [
          "#FFD700", // Gold
          "#FF6B00", // Orange
          "#00CED1", // Teal
          "#9370DB", // Purple
          "#32CD32", // Green
          "#FF69B4", // Pink
          "#4169E1"  // Royal Blue
        ]
      },
      size: {
        value: { min: 5, max: 8 }
      },
      move: {
        speed: { min: 15, max: 28 },
        direction: "none" as "none",
        outModes: { default: "destroy" as "destroy" }
      }
    },
    emitters: [
      // Top left corner - flows toward center with wide spread
      {
        position: { x: 0, y: 25 },
        rate: { delay: 0.1, quantity: 5 },
        life: { duration: 0.2, count: 15 },
        particles: {
          move: {
            direction: "bottom-right" as "bottom-right",
            angle: { value: -135, offset: -45 }
          }
        }
      },
      // Top center - flows down toward center with wide spread
      {
        position: { x: 22, y: 0 },
        rate: { delay: 0.1, quantity: 5 },
        life: { duration: 0.2, count: 15 },
        particles: {
          move: {
            direction: "bottom" as "bottom",
            angle: { value: -135, offset: -45 }
          }
        }
      },
      // Top right corner - flows toward center with wide spread
      {
        position: { x: 77, y: 0 },
        rate: { delay: 0.1, quantity: 5 },
        life: { duration: 0.2, count: 15 },
        particles: {
          move: {
            direction: "bottom-left" as "bottom-left",
            angle: { value: 135, offset: 45 }
          }
        }
      },
      // Top right corner - flows toward center with wide spread
      {
        position: { x: 100, y: 30 },
        rate: { delay: 0.1, quantity: 5 },
        life: { duration: 0.2, count: 15 },
        particles: {
          move: {
            direction: "bottom-left" as "bottom-left",
            angle: { value: 135, offset: 45 }
          }
        }
      },
    ]
  };

  const handleShareWithInvestors = () => {
    onOpenChange(false);
    onShareWithInvestors?.();
  };

  return (
    <>
      {/* Celebration Confetti */}
      {open && particlesInit && (
        <Particles
          id="genesis-celebration-confetti"
          options={confettiOptions}
        />
      )}

      {/* Completion Celebration Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-sm mt-2 text-muted-foreground">
              You've completed all {totalSteps} steps of XyReg Genesis. Your device is ready for investor review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Share with Investors - Info + Button */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Presentation className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Share your progress with potential investors
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Generate a professional pitch deck showcasing your device viability and market potential
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                onClick={handleShareWithInvestors}
              >
                <Presentation className="h-4 w-4 mr-2" />
                Share with Investors
              </Button>
            </div>

            {/* Upgrade to HELIXOS - Info + Button */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <Rocket className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Full lifecycle management with QMS & regulatory
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                    Take your device from concept to market with integrated compliance and submission tools
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white hover:text-white"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Explore HELIX OS
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              className="w-full text-foreground/80 underline underline-offset-4"
              onClick={() => onOpenChange(false)}
            >
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
