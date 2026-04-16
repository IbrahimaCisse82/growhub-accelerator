import { useState } from "react";
import GhButton from "@/components/shared/GhButton";
import GhCard from "@/components/shared/GhCard";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizPlayerProps {
  questions: QuizQuestion[];
  moduleName: string;
  onComplete?: (score: number, total: number) => void;
}

export default function QuizPlayer({ questions, moduleName, onComplete }: QuizPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="text-sm text-muted-foreground text-center py-6">Aucune question disponible</div>;
  }

  const q = questions[currentIdx];
  const isCorrect = selectedOption === q.correct;

  const handleAnswer = () => {
    if (selectedOption === null) return;
    setAnswered(true);
    if (isCorrect) setCorrectCount(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = correctCount + (isCorrect ? 0 : 0); // already counted
      setFinished(true);
      onComplete?.(correctCount, questions.length);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  };

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <GhCard title={`Résultat — ${moduleName}`}>
        <div className="text-center py-6 space-y-3">
          <div className={`text-5xl font-mono font-bold ${passed ? "text-gh-green" : "text-gh-rose"}`}>{pct}%</div>
          <div className="text-sm text-foreground font-semibold">{correctCount}/{questions.length} bonnes réponses</div>
          <div className={`text-sm ${passed ? "text-gh-green" : "text-gh-rose"}`}>
            {passed ? "Félicitations, quiz validé !" : "Score insuffisant (≥70% requis)"}
          </div>
        </div>
      </GhCard>
    );
  }

  return (
    <GhCard title={`Quiz — ${moduleName}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Question {currentIdx + 1}/{questions.length}</span>
          <span>{correctCount} correct{correctCount > 1 ? "es" : ""}</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm font-semibold text-foreground">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let borderClass = "border-border";
            if (answered) {
              if (i === q.correct) borderClass = "border-gh-green bg-gh-green/5";
              else if (i === selectedOption) borderClass = "border-gh-rose bg-gh-rose/5";
            } else if (i === selectedOption) {
              borderClass = "border-primary bg-primary/5";
            }
            return (
              <button
                key={i}
                onClick={() => !answered && setSelectedOption(i)}
                disabled={answered}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm text-foreground transition-colors ${borderClass} ${!answered ? "hover:border-primary/50 cursor-pointer" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {answered && i === q.correct && <CheckCircle2 size={14} className="text-gh-green shrink-0" />}
                  {answered && i === selectedOption && i !== q.correct && <XCircle size={14} className="text-gh-rose shrink-0" />}
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          {!answered ? (
            <GhButton onClick={handleAnswer} disabled={selectedOption === null}>Valider</GhButton>
          ) : (
            <GhButton onClick={handleNext}>
              {currentIdx + 1 >= questions.length ? "Voir le résultat" : "Question suivante"}
            </GhButton>
          )}
        </div>
      </div>
    </GhCard>
  );
}
