import React, { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, Award, ArrowRight, RotateCcw } from "lucide-react";
import { QUIZ_QUESTIONS } from "../data";

export function QuizSection() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);

  const handleOptionSelect = (idx: number) => {
    if (submitted) return;
    setSelectedOpt(idx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null || submitted) return;
    setSubmitted(true);
    if (selectedOpt === QUIZ_QUESTIONS[currentIdx].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setSubmitted(false);
    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setSubmitted(false);
    setScore(0);
    setQuizComplete(false);
  };

  const q = QUIZ_QUESTIONS[currentIdx];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-3xl mx-auto text-slate-705">
      {/* Quiz Progress & Metrics */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-650" />
            KNX Professional Certification Quiz
          </h3>
          <p className="text-slate-505 text-xs font-semibold">
            Test and verify your understanding of physical/logical bus requirements and timing properties.
          </p>
        </div>
        {!quizComplete && (
          <span className="text-xs font-mono font-bold text-slate-500">
            {currentIdx + 1} of {QUIZ_QUESTIONS.length}
          </span>
        )}
      </div>

      {!quizComplete ? (
        <div className="space-y-5">
          <div className="text-slate-800 text-sm font-extrabold leading-relaxed">
            {q.question}
          </div>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let btnClass = "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350";
              
              if (selectedOpt === i && !submitted) {
                btnClass = "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold";
              } else if (submitted) {
                if (i === q.correctIndex) {
                  btnClass = "bg-emerald-50 border-emerald-250 text-emerald-800 font-bold";
                } else if (selectedOpt === i) {
                  btnClass = "bg-rose-50 border-rose-250 text-rose-700 font-semibold";
                } else {
                  btnClass = "opacity-50 bg-slate-50/50 border-slate-100 text-slate-400";
                }
              }

              return (
                <button
                  key={`opt-${i}`}
                  type="button"
                  onClick={() => handleOptionSelect(i)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed font-semibold transition-all flex items-start gap-3 cursor-pointer shadow-xs ${btnClass}`}
                >
                  <span className="font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-250 text-slate-600 font-bold text-[10px] shrink-0 mt-0.5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Action Trigger keys */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedOpt === null}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border shadow-xs ${
                  selectedOpt !== null
                    ? "bg-indigo-600 border-indigo-700 text-white cursor-pointer hover:bg-indigo-700"
                    : "bg-slate-100 border-slate-150 text-slate-400 cursor-not-allowed"
                }`}
              >
                Submit Answer
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all border border-indigo-700 cursor-pointer shadow-xs"
              >
                Next Challenge
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Correct/Incorrect Explanation Banner */}
          {submitted && (
            <div className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed animate-fade-in font-medium ${
              selectedOpt === q.correctIndex 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-225 text-rose-700"
            }`}>
              {selectedOpt === q.correctIndex ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-650 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-650 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block mb-1 font-bold text-sm">
                  {selectedOpt === q.correctIndex ? "Correct Answer!" : "Incorrect Answer"}
                </strong>
                <p>
                  {selectedOpt === q.correctIndex
                    ? q.explanation
                    : q.explanation.replace(/^(Excellent choice!|That is correct!|Excellent!|Correct!|Perfect!|Exactly!)\s*/i, "")}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-5 animate-fade-in">
          <div className="inline-block relative">
            <Award className="h-16 w-16 text-indigo-600 mx-auto animate-bounce-slow" />
            <div className="absolute inset-0 bg-indigo-400/10 blur-2xl rounded-full" />
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Quiz Completed!</h4>
            <p className="text-slate-500 text-xs font-semibold">
              Excellent attempt. You completed the certification checkpoint successfully.
            </p>
          </div>

          <div className="bg-indigo-50 p-5 border border-indigo-120 border-dashed rounded-2xl max-w-xs mx-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Final Score Metrics</span>
            <span className="text-3xl font-extrabold font-mono text-indigo-700 block">
              {score} / {QUIZ_QUESTIONS.length}
            </span>
            <span className="text-xs text-slate-600 block mt-1 font-bold">
              ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}% Pass Rating)
            </span>
          </div>

          <button
            type="button"
            onClick={restartQuiz}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 hover:border-slate-350 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-indigo-600" />
            Restart Challenge
          </button>
        </div>
      )}
    </div>
  );
}
