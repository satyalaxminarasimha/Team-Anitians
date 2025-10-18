
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-custom-xl border-0 bg-card/80 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <BrainCircuit className="h-16 w-16 text-primary animate-pulse-slow" />
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-lg opacity-50"></div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-headline bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to sign in to your account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 px-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isPending}
                className="h-12 border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isPending}
                className="h-12 border-2 focus:border-primary transition-colors"
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-6">
            <Button 
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 hover:scale-[1.02]" 
              onClick={handleLogin} 
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="w-full text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Register
              </Link>
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}
