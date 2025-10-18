
"use client";
/**
 * @fileOverview This file contains the DashboardPage, which serves as the central
 * hub for the user. It displays at-a-glance metrics, weak areas, and recent activity.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2, TrendingDown, History, BarChart, Award, Gem } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStatsAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useQuizHistory } from "@/hooks/use-quiz-history";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
    quizCount: number;
    points: number;
    badges: string[];
    currentStreak: number;
    longestStreak: number;
}

const icons = {
  BarChart,
  Gem,
  Award,
  TrendingDown,
  History,
};
type IconName = keyof typeof icons;

/**
 * @component StatCard
 * @description A reusable card component to display a single statistic on the dashboard.
 */
function StatCard({ icon, title, value, description, color = "blue" }: { 
    icon: IconName; 
    title: string; 
    value: string | number; 
    description?: string;
    color?: "blue" | "purple" | "green" | "orange" | "red";
}) {
    const Icon = icons[icon];
    
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600", 
        green: "from-green-500 to-green-600",
        orange: "from-orange-500 to-orange-600",
        red: "from-red-500 to-red-600"
    };
    
    return (
        <Card className="group hover:shadow-custom-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-custom-sm`}>
                    {Icon && <Icon className="h-4 w-4 text-white" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {value}
                </div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

/**
 * @component DashboardPage
 * @description The main component for the user dashboard. It fetches and displays
 * key performance indicators and other relevant user information.
 */
export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { history, loading: historyLoading } = useQuizHistory();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getDashboardStatsAction(user.email).then(result => {
                if (result.success && result.data) {
                    setStats(result.data as DashboardStats);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Dashboard Error",
                        description: result.error || "Could not load your dashboard data.",
                    });
                }
                setLoading(false);
            });
        }
    }, [user, toast]);

    const isLoading = authLoading || loading;

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const recentQuizzes = history.slice(0, 3);
    const weakestTopics = [...new Set(history.flatMap(h => h.performanceAnalysis?.weakestTopics || []))].slice(0, 5);


    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto max-w-7xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-12 animate-fade-in">
                    <div className="relative">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                            Welcome Back, {user.name.split(' ')[0]}! 👋
                        </h1>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-lg blur-sm opacity-50"></div>
                    </div>
                    <p className="mt-4 text-lg sm:text-xl text-muted-foreground animate-slide-up">
                        Here's a summary of your progress. Let's keep learning!
                    </p>
                </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard icon="BarChart" title="Quizzes Taken" value={stats?.quizCount ?? 0} color="blue" />
                <StatCard icon="Gem" title="Total Points" value={stats?.points ?? 0} color="purple" />
                <StatCard icon="Award" title="Badges Earned" value={stats?.badges.length ?? 0} color="green" />
                <StatCard 
                    icon="TrendingDown" 
                    title="Current Streak" 
                    value={`${stats?.currentStreak ?? 0} days`} 
                    description={`Longest: ${stats?.longestStreak ?? 0} days`}
                    color="orange"
                />
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                 {/* Weak Areas */}
                <div className="lg:col-span-1">
                    <Card className="h-full hover:shadow-custom-lg transition-all duration-300 animate-slide-up">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-custom-sm">
                                    <TrendingDown className="h-4 w-4 text-white"/>
                                </div>
                                Prioritized Weak Areas
                            </CardTitle>
                             <CardDescription>Based on your recent quizzes, focus here to improve your score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {weakestTopics.length > 0 ? (
                                <ul className="space-y-3">
                                   {weakestTopics.map((topic, index) => (
                                       <li key={topic} className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 hover:shadow-custom-sm transition-all duration-200 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                                           {topic}
                                       </li>
                                   ))}
                                </ul>
                           ) : (
                               <div className="text-center py-8">
                                   <div className="p-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                       <Award className="h-8 w-8 text-green-600"/>
                                   </div>
                                   <p className="text-sm text-muted-foreground">No weak areas identified yet. Keep practicing!</p>
                               </div>
                           )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <Card className="hover:shadow-custom-lg transition-all duration-300 animate-slide-up">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-custom-sm">
                                    <History className="h-4 w-4 text-white"/>
                                </div>
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Review your last few quizzes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary"/>
                                </div>
                            ) : recentQuizzes.length > 0 ? (
                                <div className="space-y-4">
                                    {recentQuizzes.map((quiz, index) => (
                                        <Link href="/history" key={quiz.id} className="block border p-4 rounded-lg hover:shadow-custom-md transition-all duration-200 hover:-translate-y-1 bg-gradient-to-r from-card to-card/50 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-lg">{quiz.config.engineeringStream}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(quiz.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                            Math.round((quiz.score / quiz.questions.length) * 100) >= 80 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                : Math.round((quiz.score / quiz.questions.length) * 100) >= 60
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                        }`}>
                                                            {Math.round((quiz.score / quiz.questions.length) * 100)}%
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{quiz.score}/{quiz.questions.length} correct</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Gem className="h-8 w-8 text-primary"/>
                                    </div>
                                    <p className="text-muted-foreground mb-4">You haven't taken any quizzes yet.</p>
                                    <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-custom-md">
                                        <Link href="/quiz">Start Your First Quiz</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            </div>
        </div>
    );
}

