
"use client";
/**
 * @fileOverview This file contains the DashboardPage, which serves as the central
 * hub for the user. It displays at-a-glance metrics, weak areas, and recent activity.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth.tsx";
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
        <div className="container mx-auto max-w-7xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
                    Welcome Back, {user.name.split(' ')[0]}!
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
                    Here's a summary of your progress. Let's keep learning!
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard icon="BarChart" title="Quizzes Taken" value={stats?.quizCount ?? 0} />
                <StatCard icon="Gem" title="Total Points" value={stats?.points ?? 0} />
                <StatCard icon="Award" title="Badges Earned" value={stats?.badges.length ?? 0} />
                <StatCard 
                    icon="TrendingDown" 
                    title="Current Streak" 
                    value={`${stats?.currentStreak ?? 0} days`} 
                    description={`Longest: ${stats?.longestStreak ?? 0} days`}
                />
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                 {/* Weak Areas */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><TrendingDown className="text-destructive"/> Prioritized Weak Areas</CardTitle>
                             <CardDescription>Based on your recent quizzes, focus here to improve your score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {weakestTopics.length > 0 ? (
                                <ul className="space-y-2">
                                   {weakestTopics.map(topic => (
                                       <li key={topic} className="p-3 bg-muted/50 rounded-md text-sm font-medium">{topic}</li>
                                   ))}
                                </ul>
                           ) : (
                               <p className="text-sm text-muted-foreground text-center py-8">No weak areas identified yet. Keep practicing!</p>
                           )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><History/> Recent Activity</CardTitle>
                            <CardDescription>Review your last few quizzes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? <Loader2 className="animate-spin mx-auto"/> : 
                             recentQuizzes.length > 0 ? (
                                <div className="space-y-4">
                                    {recentQuizzes.map(quiz => (
                                        <Link href="/history" key={quiz.id} className="block border p-4 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{quiz.config.engineeringStream}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(quiz.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{Math.round((quiz.score / quiz.questions.length) * 100)}%</p>
                                                    <p className="text-sm text-muted-foreground">{quiz.score}/{quiz.questions.length} correct</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground mb-4">You haven't taken any quizzes yet.</p>
                                    <Button asChild>
                                        <Link href="/">Start Your First Quiz</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/**
 * @component StatCard
 * @description A reusable card component to display a single statistic on the dashboard.
 */
function StatCard({ icon, title, value, description }: { icon: IconName, title: string, value: string | number, description?: string }) {
    const Icon = icons[icon];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}
