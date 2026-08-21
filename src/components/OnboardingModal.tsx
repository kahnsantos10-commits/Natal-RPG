import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Zap, Dice5, ArrowRight, X } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    title: "Navegação no Mapa",
    description: "Use o mouse para arrastar o mapa. Clique e arraste tokens para movimentá-los. O Mestre pode controlar a visibilidade da névoa de guerra.",
    icon: <Compass className="w-12 h-12 text-amber-400" />,
  },
  {
    title: "Iniciativa de Combate",
    description: "Adicione personagens ao tracker. O Mestre controla a ordem dos turnos. Clique na miniatura para focar no token no mapa.",
    icon: <Zap className="w-12 h-12 text-purple-400" />,
  },
  {
    title: "Rolagem de Dados 3D",
    description: "Abra a Torre de Dados, escolha o dado, adicione modificadores e role! O resultado aparece no chat e para todos no telão.",
    icon: <Dice5 className="w-12 h-12 text-emerald-400" />,
  },
];

export const OnboardingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("onboarding_shown", "true");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center space-y-4"
            >
              {steps[currentStep].icon}
              <h2 className="text-2xl font-bold text-white">{steps[currentStep].title}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">{steps[currentStep].description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentStep ? "bg-amber-500" : "bg-neutral-700"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {currentStep === steps.length - 1 ? "Começar Agora" : "Próximo"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
