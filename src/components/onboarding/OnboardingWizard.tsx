import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GhButton from "@/components/shared/GhButton";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Rocket, Users, BarChart3, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: Rocket,
    title: "Bienvenue sur Grow Hub Management System",
    description: "Votre plateforme tout-en-un pour gérer programmes d'accélération, cohortes, entreprises et mentors.",
    tips: [
      "Naviguez grâce au menu latéral pour accéder à tous les modules",
      "Utilisez ⌘K pour rechercher rapidement dans toute la plateforme",
      "Cliquez sur votre avatar pour accéder à votre profil",
    ],
  },
  {
    icon: Users,
    title: "Gérez vos programmes",
    description: "Créez des portefeuilles, programmes et cohortes pour structurer votre activité d'accompagnement.",
    tips: [
      "Portefeuille → Programme → Projet → Cohorte → Entreprise",
      "Chaque niveau hérite des paramètres du niveau supérieur",
      "Les candidatures peuvent être liées à un programme spécifique",
    ],
  },
  {
    icon: BarChart3,
    title: "Suivez la performance",
    description: "Tableaux de bord, KPIs, rapports et analytics pour mesurer l'impact de vos programmes.",
    tips: [
      "Le Dashboard affiche les métriques clés en temps réel",
      "Exportez vos données en CSV, JSON ou PDF",
      "Configurez la collecte de données pour vos entreprises",
    ],
  },
  {
    icon: MessageCircle,
    title: "Collaborez efficacement",
    description: "Messagerie intégrée, coaching, LMS et planning pour un accompagnement de qualité.",
    tips: [
      "Utilisez la messagerie pour communiquer avec votre équipe",
      "Le matching mentor↔startup utilise un algorithme intelligent",
      "Les notifications vous tiennent informé en temps réel",
    ],
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile } = useAuth();
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Progress */}
        <div className="flex gap-1 px-6 pt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= currentStep ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon size={28} className="text-primary" />
              </div>
              {currentStep === 0 && profile?.full_name && (
                <div className="text-sm text-muted-foreground mb-1">
                  Bonjour {profile.full_name.split(" ")[0]} 👋
                </div>
              )}
              <h2 className="text-lg font-bold text-foreground">{step.title}</h2>
              <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
            </div>

            {/* Tips */}
            <div className="space-y-2.5 mb-6">
              {step.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-surface-2 rounded-lg p-3">
                  <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-[12.5px] text-foreground">{tip}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground font-mono">
                {currentStep + 1} / {steps.length}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <GhButton variant="ghost" size="md" onClick={() => setCurrentStep(s => s - 1)}>
                    Précédent
                  </GhButton>
                )}
                {!isLast && (
                  <GhButton variant="ghost" size="md" onClick={onComplete}>
                    Passer
                  </GhButton>
                )}
                <GhButton
                  variant="primary"
                  size="md"
                  onClick={() => isLast ? onComplete() : setCurrentStep(s => s + 1)}
                >
                  {isLast ? "Commencer →" : "Suivant →"}
                </GhButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
