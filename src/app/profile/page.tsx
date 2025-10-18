
"use client";
/**
 * @fileOverview This file contains the ProfilePage component, which allows
 * authenticated users to view and edit their profile information, including their
 * name, college, and profile picture. It also displays gamification stats.
 */

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, Camera, Gem, Award, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateUserAction } from "./actions";
import { getDashboardStatsAction } from "@/app/actions";

interface ProfileStats {
    points: number;
    badges: string[];
    currentStreak: number;
}

/**
 * @component ProfilePage
 * @description The main component for the user profile page. It manages the
 * editing state, handles form inputs, and calls the server action to update the profile.
 */
export default function ProfilePage() {
  const { user, loading, logout, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [isPending, startTransition] = useTransition();

  // Effect to redirect unauthenticated users and populate form fields when user data is available.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setName(user.name);
      setCollege(user.college);
      setProfilePicture(user.profilePicture || null);

      setStatsLoading(true);
      getDashboardStatsAction(user.email).then(result => {
        if (result.success && result.data) {
          setStats(result.data as ProfileStats);
        }
        setStatsLoading(false);
      });
    }
  }, [user, loading, router]);

  /**
   * Handles the selection of a new profile picture.
   * Reads the image file and converts it to a base64 data URI.
   * @param {ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handles saving the updated profile information by calling the server action.
   */
  const handleSave = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await updateUserAction({ 
        name, 
        college, 
        email: user.email,
        profilePicture: profilePicture || undefined
      });
      if (result.success && result.user) {
        toast({ title: "Success", description: result.message });
        setUser(result.user as any); // Update user in the global auth context.
        setIsEditing(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };
  
  /**
   * Handles canceling the edit mode, reverting any changes.
   */
  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setCollege(user.college);
      setProfilePicture(user.profilePicture || null);
    }
    setIsEditing(false);
  }

  // Display loading spinner while checking authentication.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 text-3xl border-4 border-background">
                <AvatarImage src={profilePicture || undefined} alt={user.name} />
                <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Label htmlFor="profilePictureInput" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                  <Input id="profilePictureInput" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </Label>
              )}
            </div>
            <div className="grid gap-1">
              <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Gamification Stats */}
          <div className="grid grid-cols-3 gap-4 text-center mb-6 border-b pb-6">
              <div>
                  <Gem className="mx-auto h-6 w-6 text-primary mb-1"/>
                  <p className="text-xl font-bold">{stats?.points ?? '...'}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                  <Award className="mx-auto h-6 w-6 text-yellow-500 mb-1"/>
                  <p className="text-xl font-bold">{stats?.badges?.length ?? '...'}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
              </div>
              <div>
                  <Flame className="mx-auto h-6 w-6 text-orange-500 mb-1"/>
                  <p className="text-xl font-bold">{stats?.currentStreak ?? '...'}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
              </div>
          </div>

          {isEditing ? (
            // Form displayed in edit mode.
            <div className="grid gap-6 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="college">College</Label>
                <Input id="college" value={college} onChange={(e) => setCollege(e.target.value)} />
              </div>
            </div>
          ) : (
            // Static info displayed in view mode.
             <div className="space-y-6 pt-4 text-sm">
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{user.name}</p>
                </div>
                <div className="flex justify-between">
                    <p className="text-muted-foreground">College</p>
                    <p className="font-medium">{user.college}</p>
                </div>
                 <div className="flex justify-between">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
             {isEditing ? (
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Save Changes
                    </Button>
                     <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2" />
                    Edit Profile
                </Button>
            )}
            <Button variant="outline" onClick={logout}>Logout</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
