import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, MapPin, Building, Calendar, Edit, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import MemberDirectory from '@/components/MemberDirectory';

export default function UserDashboard() {
  const { user, isApproved } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect if not approved
  if (!isApproved) {
    return <Navigate to="/waiting-approval" replace />;
  }

  const profile = user?.profile;

  return (
    <div className="min-h-screen bg-background">
      <Header showUserInfo={true} showSignOut={true} />

      <main className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome, {profile?.first_name}!</h1>
          <p className="text-muted-foreground">Connect with fellow alumni and explore the directory</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Directory
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Member Directory</h2>
                <p className="text-muted-foreground">
                  Connect with fellow alumni and expand your professional network.
                </p>
              </div>
              <MemberDirectory />
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">IIM-AMS Members Directory</h2>
                <p className="text-muted-foreground">
                  Connect with fellow alumni and expand your professional network.
                </p>
              </div>
              <MemberDirectory />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}