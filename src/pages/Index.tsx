import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock } from "lucide-react";

export default function Index() {
  const { user, loading, isAdmin, isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect authenticated users with complete profiles
    if (!loading && user && user.profile) {
      if (isAdmin) {
        // Admin user - redirect to admin dashboard
        navigate('/admin');
      } else if (user.approvalStatus === 'pending') {
        // Normal user with pending approval
        if (!user.profile?.first_name || !user.profile?.phone) {
          // Profile incomplete - redirect to registration
          navigate('/registration');
        } else {
          // Profile complete but pending approval
          navigate('/waiting-approval');
        }
      } else if (isApproved) {
        // Normal user with approved profile
        navigate('/dashboard');
      } else if (user.approvalStatus === 'rejected') {
        // Rejected user
        navigate('/waiting-approval');
      }
    }
    // If loading is complete and no user, stay on landing page (will show sign in options)
  }, [user, loading, isAdmin, isApproved, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated with profile, they will be redirected by useEffect, show loading
  if (user && user.profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  // If user exists but no profile, redirect to auth (sign out scenario)
  if (user && !user.profile) {
    navigate('/auth');
    return null;
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">IIM-AMS Portal</h1>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to IIM-AMS Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A professional platform for IIM alumni, students, and professionals. 
            Connect, collaborate, and grow your network with fellow members.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Professional Network</CardTitle>
              <CardDescription>
                Connect with IIM alumni and professionals from various industries and backgrounds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <UserCheck className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Verified Profiles</CardTitle>
              <CardDescription>
                All member profiles are verified by our admin team to ensure authenticity and quality.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Quick Approval</CardTitle>
              <CardDescription>
                Fast and efficient profile approval process to get you connected with the community quickly.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Sign Up</h3>
              <p className="text-gray-600">Create your account and fill in your complete profile details.</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Admin Review</h3>
              <p className="text-gray-600">Our admin team reviews and verifies your profile for authenticity.</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Get Connected</h3>
              <p className="text-gray-600">Once approved, access your dashboard and connect with the community.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}