
"use client";
/**
 * @fileOverview This file contains the LoginPage component, which provides
 * a form for users to sign in to their accounts.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * @component LoginPage
 * @description A page component containing a login form. It handles user input,
 * calls the `login` function from the `useAuth` hook, and provides feedback
 * to the user via toasts.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  /**
   * Handles the login form submission.
   */
  const handleLogin = () => {
    startTransition(async () => {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/"); // Redirect to home page on successful login.
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.message || "Invalid email or password.",
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : "Sign In"}
          </Button>
        </CardFooter>
         <p className="px-6 pb-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="underline hover:text-primary">
                Register
            </Link>
          </p>
      </Card>
    </div>
  );
}
