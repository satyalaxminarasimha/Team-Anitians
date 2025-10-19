
"use client";
/**
 * @fileOverview This file contains the core logic for the quiz generation and interaction flow.
 * It manages the state for the entire quiz process, from configuration to results.
 *
 * The main component `GateAiPrep` acts as a state machine, rendering different
 * sub-components based on the current step: "config", "loading", "quiz", or "results".
 *
 * @exports QuizConfig - The type definition for the quiz configuration object.
 * @exports Question - The type definition for a single MCQ.
 * @exports UserAnswers - The type definition for the user's answers object.
 */

import type { GenerateMCQQuestionsOutput } from "@/ai/flows/generate-mcq-questions";
import { generateQuizAction, analyzePerformanceAction } from "@/app/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Sparkles } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useForm, type SubmitHandler, FormProvider } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuizHistory } from "@/hooks/use-quiz-history";
import { examMap } from "@/lib/syllabus";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ResultItem } from "@/components/quiz-result-item";
import { useRouter } from "next/navigation";


/**
 * @const {z.ZodObject} quizConfigSchema
 * @description Zod schema for validating the quiz configuration form.
 */
const quizConfigSchema = z.object({
  exam: z.string().min(1, "Please select an exam."),
  engineeringStream: z.string().min(1, "Please select a stream or subject."),
  syllabus: z.string().min(10, "Syllabus must be at least 10 characters.").max(10000),
  difficultyLevel: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1).max(100),
});

export type QuizConfig = z.infer<typeof quizConfigSchema>;
export type Question = GenerateMCQQuestionsOutput["mcqQuestions"][0] & { timeTaken?: number; topic?: string };
export type UserAnswers = Record<number, string>;

/**
 * @component GateAiPrep
 * @description The main state machine component for the quiz flow.
 * It controls which step of the process is currently active and passes props
 * down to the relevant sub-component.
 */
export default function GateAiPrep() {
  const [step, setStep] = useState<"config" | "loading" | "quiz" | "results">("config");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState(0);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const { addQuizToHistory } = useQuizHistory();
  const { user } = useAuth();
  const router = useRouter();

  
  /**
   * Starts the quiz session with the generated questions and config.
   * @param {Question[]} generatedQuestions - The questions from the AI.
   * @param {QuizConfig} config - The configuration used to generate the quiz.
   */
  const handleQuizStart = (generatedQuestions: Question[], config: QuizConfig) => {
    setQuestions(generatedQuestions);
    setQuizConfig(config);
    setUserAnswers({});
    setScore(0);
    setTotalTime(0);
    setHistoryId(null);
    setStep("quiz");
  };

  /**
   * Submits the quiz, calculates the score, and moves to the results step.
   * @param {UserAnswers} answers - The user's submitted answers.
   * @param {Question[]} finalQuestionsState - Questions with time taken.
   * @param {number} finalTotalTime - Total quiz time in seconds.
   */
  const handleQuizSubmit = async (answers: UserAnswers, finalQuestionsState: Question[], finalTotalTime: number) => {
    let correctCount = 0;
    finalQuestionsState.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    setUserAnswers(answers);
    setQuestions(finalQuestionsState); // Save questions with time taken
    setTotalTime(finalTotalTime);
    setStep("results");

    // Save the quiz to the user's history and get the ID for analysis
    if (quizConfig && user) {
       const result = await addQuizToHistory({
        date: new Date(),
        questions: finalQuestionsState,
        userAnswers: answers,
        score: correctCount,
        config: quizConfig,
        totalTime: finalTotalTime,
      });
      if (result?.historyId) {
          setHistoryId(result.historyId);
      }
    }
  };

  /**
   * Resets the entire quiz flow back to the configuration step.
   */
  const handleRestart = () => {
    setStep("config");
    setQuestions([]);
    setUserAnswers({});
    setQuizConfig(null);
    setHistoryId(null);
  };
  
  /**
   * Allows the user to retry the same quiz without generating new questions.
   */
  const handleTryAgain = () => {
    setStep("quiz");
    setUserAnswers({});
    setScore(0);
    setTotalTime(0);
  }

  // Set up default values for the form based on the syllabus data.
  const defaultExam = Array.from(examMap.keys())[0];
  const defaultExamData = examMap.get(defaultExam);
  const defaultStream = defaultExamData ? Array.from(defaultExamData.streams.keys())[0] : "";
  const defaultSyllabus = defaultExamData?.streams.get(defaultStream) || "";
  
  const formMethods = useForm<QuizConfig>({
    resolver: zodResolver(quizConfigSchema),
    defaultValues: {
      exam: defaultExam,
      engineeringStream: defaultStream,
      syllabus: defaultSyllabus,
      difficultyLevel: "Medium",
      numberOfQuestions: 10,
    },
  });


  switch (step) {
    case "config":
      return <QuizConfigForm onQuizStart={handleQuizStart} setStep={setStep} formMethods={formMethods} />;
    case "loading":
        return <LoadingState />;
    case "quiz":
      return <QuizSession questions={questions} onQuizSubmit={handleQuizSubmit} onQuit={handleRestart} />;
    case "results":
      return (
        <QuizResults
          questions={questions}
          userAnswers={userAnswers}
          score={score}
          onRestart={handleRestart}
          onTryAgain={handleTryAgain}
          quizConfig={quizConfig}
          totalTime={totalTime}
          historyId={historyId}
          user={user}
        />
      );
    default:
      return null;
  }
}

/**
 * @component QuizConfigForm
 * @description The form where users configure the parameters for their desired quiz.
 * @param {object} props
 */
function QuizConfigForm({
  onQuizStart,
  setStep,
  formMethods,
}: {
  onQuizStart: (questions: Question[], config: QuizConfig) => void;
  setStep: (step: "loading" | "config") => void;
  formMethods: ReturnType<typeof useForm<QuizConfig>>
}) {
  const { toast } = useToast();
  const [showStreamSelector, setShowStreamSelector] = useState(true);
  const { user } = useAuth();
  const form = formMethods;

  const selectedExam = form.watch("exam");
  const streamsForSelectedExam = examMap.get(selectedExam)?.streams;

  /**
   * Handles changes to the selected exam, updating the available streams and syllabus.
   * @param {string} examName - The name of the selected exam.
   */
  const handleExamChange = (examName: string) => {
    form.setValue("exam", examName);
    const examData = examMap.get(examName);
    if (examData) {
      const streams = Array.from(examData.streams.keys());
      const examNeedsStreamSelection = examData.selectableStreams ?? true;

      if (examNeedsStreamSelection && streams.length > 1) {
        const firstStream = streams[0] || "";
        form.setValue("engineeringStream", firstStream);
        form.setValue("syllabus", examData.streams.get(firstStream) || "");
        setShowStreamSelector(true);
      } else {
        const streamOrSubject = streams[0] || examName;
        form.setValue("engineeringStream", streamOrSubject);
        const combinedSyllabus = Array.from(examData.streams.values()).join(', ');
        form.setValue("syllabus", combinedSyllabus);
        setShowStreamSelector(false);
      }
    }
  };

  // Initialize form on first render.
  React.useEffect(() => {
    handleExamChange(selectedExam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles changes to the selected stream, updating the syllabus.
   * @param {string} streamName - The name of the selected stream.
   */
  const handleStreamChange = (streamName: string) => {
    form.setValue("engineeringStream", streamName);
    if (streamsForSelectedExam) {
      form.setValue("syllabus", streamsForSelectedExam.get(streamName) || "");
    }
  };

  /**
   * Handles the submission of the configuration form.
   * @param {QuizConfig} data - The validated form data.
   */
  const onSubmit: SubmitHandler<QuizConfig> = async (data) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to generate a quiz.",
      });
      return;
    }

    setStep("loading");
    
    const actionPayload = { ...data, userEmail: user.email };
    const result = await generateQuizAction(actionPayload);

    if (result.success && result.data && result.data.mcqQuestions.length > 0) {
      onQuizStart(result.data.mcqQuestions, data);
    } else {
      toast({
        variant: "destructive",
        title: "Error Generating Quiz",
        description: result.error || "Could not generate questions. Please try again with different parameters.",
      });
      setStep("config");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Create Your Practice Quiz
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-lg blur-sm opacity-50"></div>
          </div>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground animate-slide-up">
            Select your exam and customize the quiz to focus on your preparation needs.
          </p>
        </div>
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-custom-xl border-0 bg-card/80 backdrop-blur-sm animate-scale-in">
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <FormField
                control={form.control}
                name="exam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Select Exam</FormLabel>
                    <Select onValueChange={handleExamChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                          <SelectValue placeholder="Select your exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(examMap.keys()).map((exam) => (
                          <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showStreamSelector && (
                <FormField
                  control={form.control}
                  name="engineeringStream"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Stream / Subject</FormLabel>
                      <Select onValueChange={handleStreamChange} value={field.value} disabled={!streamsForSelectedExam}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                            <SelectValue placeholder="Select your stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {streamsForSelectedExam && Array.from(streamsForSelectedExam.keys()).map((stream) => (
                            <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium">Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                            <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="numberOfQuestions"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium">Number of Questions</FormLabel>
                        <FormControl>
                        <Input type="number" min="1" max="100" {...field} className="h-12 border-2 focus:border-primary transition-colors" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="syllabus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Syllabus Topics</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="The syllabus for the selected stream will appear here. You can edit it to focus on specific topics."
                      {...field}
                      rows={8}
                      className="border-2 focus:border-primary transition-colors resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-sm">
                    You can edit the syllabus to concentrate on specific areas for your quiz.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="px-8 pb-8">
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting} 
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 hover:scale-[1.02]"
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Quiz...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Quiz
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
      </div>
    </div>
  );
}

/**
 * @component LoadingState
 * @description A component that displays a loading spinner and message while the AI is generating the quiz.
 */
function LoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <Card className="shadow-custom-xl border-0 bg-card/80 backdrop-blur-sm animate-scale-in">
              <CardContent className="flex flex-col items-center justify-center p-12">
                <div className="relative mb-8">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Generating Your Quiz
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  Our AI is crafting personalized questions just for you. This may take a moment...
                </p>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    );
}

/**
 * @component QuizSession
 * @description The main component for an active quiz session. It displays one question
 * at a time and allows the user to navigate, select answers, and submit the quiz.
 * @param {object} props
 */
function QuizSession({
  questions,
  onQuizSubmit,
  onQuit,
}: {
  questions: Question[];
  onQuizSubmit: (answers: UserAnswers, questions: Question[], totalTime: number) => void;
  onQuit: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const formMethods = useForm();
  
  // Time tracking state
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() => questions.map(q => ({...q, timeTaken: 0})));
  const [startTime, setStartTime] = useState(Date.now());
  const questionStartTime = useRef(Date.now());
  const totalTimeRef = useRef(0);

  // Update time taken for the current question
  const updateQuestionTime = () => {
    const timeSpent = (Date.now() - questionStartTime.current) / 1000; // in seconds
    setQuizQuestions(prev => {
        const newQuestions = [...prev];
        newQuestions[currentQ].timeTaken = (newQuestions[currentQ].timeTaken || 0) + timeSpent;
        return newQuestions;
    });
    questionStartTime.current = Date.now(); // Reset timer for the next question
  };


  useEffect(() => {
    const interval = setInterval(() => {
        totalTimeRef.current = (Date.now() - startTime) / 1000;
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);


  const handleOptionChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: value }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      updateQuestionTime();
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      updateQuestionTime();
      setCurrentQ(currentQ - 1);
    }
  };
  
  const handleSubmit = () => {
    updateQuestionTime(); // Log time for the last question
    onQuizSubmit(answers, quizQuestions, totalTimeRef.current);
  };
  
  const progress = ((currentQ + 1) / questions.length) * 100;
  const question = questions[currentQ];

  const difficultyColors = {
      Easy: "border-green-500",
      Medium: "border-blue-500",
      Hard: "border-red-500",
  };

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="container mx-auto h-screen max-w-4xl py-8 px-4 flex flex-col">
        <FormProvider {...formMethods}>
          <Card className={cn(
              "flex-1 shadow-lg border-2 flex flex-col",
              difficultyColors[question.difficulty] || "border-transparent"
          )}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-2xl">Question {currentQ + 1} of {questions.length}</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Quit Quiz</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to quit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your progress will be lost and this quiz will not be saved in your history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onQuit} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Quit</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-8">
                <p className="text-xl font-medium">{question.question}</p>
              </div>
              <div className="flex-1">
                <RadioGroup onValueChange={handleOptionChange} value={answers[currentQ]} className="space-y-4">
                  {question.options.map((option, index) => (
                    <FormItem key={index} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                            <RadioGroupItem value={option} id={`q${currentQ}-o${index}`} />
                        </FormControl>
                        <Label htmlFor={`q${currentQ}-o${index}`} className="font-normal text-lg cursor-pointer flex-1 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                            {option}
                        </Label>
                    </FormItem>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between mt-auto">
              <Button variant="outline" onClick={handleBack} disabled={currentQ === 0} size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button onClick={handleNext} size="lg">Next</Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" size="lg">Submit Quiz</Button>
              )}
            </CardFooter>
          </Card>
        </FormProvider>
      </div>
    </div>
  );
}

/**
 * @component QuizResults
 * @description Displays the results of a completed quiz, including the score and
 * a review of each question with the correct and user answers.
 * @param {object} props
 */
function QuizResults({
  questions,
  userAnswers,
  score,
  onRestart,
  onTryAgain,
  quizConfig,
  totalTime,
  historyId,
  user,
}: {
  questions: Question[];
  userAnswers: UserAnswers;
  score: number;
  onRestart: () => void;
  onTryAgain: () => void;
  quizConfig: QuizConfig | null;
  totalTime: number;
  historyId: string | null;
  user: any | null;
}) {
  const percentage = Math.round((score / questions.length) * 100);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (historyId && user && quizConfig) {
      const analyze = async () => {
        setIsAnalyzing(true);
    const quizResults = questions.map((q, i) => ({
      number: i + 1,
      question: q.question,
      userAnswer: userAnswers[i],
      correctAnswer: q.correctAnswer,
      isCorrect: q.correctAnswer === userAnswers[i],
      timeTaken: q.timeTaken || 0,
      difficulty: q.difficulty,
      topic: q.topic || 'General',
    }));

        const payload = {
            exam: quizConfig.exam,
            stream: quizConfig.engineeringStream,
            quizResults,
            inferredLearningStyle: user.inferredLearningStyle,
        }

        const result = await analyzePerformanceAction(payload, historyId);
        if (result.success) {
            setAnalysis(result.data);
        } else {
            console.error("Failed to get performance analysis", result.error);
        }
        setIsAnalyzing(false);
      };
      analyze();
    }
  }, [historyId, user, quizConfig, questions, userAnswers]);

  const handleGoToDashboard = () => {
      router.push('/dashboard');
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">Quiz Complete!</CardTitle>
        <CardDescription className="text-lg">
            You scored {score} out of {questions.length} ({percentage}%)
        </CardDescription>
         <p className="text-sm text-muted-foreground">Total time: {Math.floor(totalTime / 60)}m {Math.round(totalTime % 60)}s</p>
      </CardHeader>
      <CardContent>
        {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <h3 className="text-xl font-semibold">Analyzing Your Performance...</h3>
                <p className="text-muted-foreground mt-2">The AI Coach is preparing your personalized feedback.</p>
            </div>
        )}
        {analysis && (
            <Card className="bg-secondary/30 mb-6">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">AI Coach Feedback</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: analysis.overallFeedback.replace(/\n/g, '<br />') }} />
                </CardContent>
            </Card>
        )}
        <h3 className="text-xl font-bold mb-4 font-headline">Review Your Answers</h3>
        <Accordion type="single" collapsible className="w-full">
            {questions.map((q, index) => (
                <ResultItem key={index} question={q} userAnswer={userAnswers[index]} index={index} quizConfig={quizConfig} />
            ))}
        </Accordion>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
        <Button variant="outline" onClick={onTryAgain}>Try This Quiz Again</Button>
      </CardFooter>
    </Card>
  );
}
