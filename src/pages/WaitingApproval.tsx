import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

export default function WaitingApproval() {
  const { user, refreshUserData, signOut, loading } = useAuth();

console.log({loading})

  const getStatusIcon = () => {
    switch (user?.approvalStatus) {
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (user?.approvalStatus) {
      case 'pending':
        return {
          title: "Registration Under Review",
          description: "Your registration is currently being reviewed by our administrators. You'll receive an email notification once your account is approved."
        };
      case 'approved':
        return {
          title: "Registration Approved!",
          description: "Congratulations! Your registration has been approved. You can now access the main dashboard."
        };
      case 'rejected':
        return {
          title: "Registration Rejected",
          description: user?.profile?.rejection_reason || "Your registration was not approved. Please contact support for more information."
        };
      default:
        return {
          title: "Status Unknown",
          description: "Unable to determine your registration status. Please try refreshing."
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex items-center justify-center p-4 pt-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{statusInfo.title}</CardTitle>
          <CardDescription className="text-center">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.approvalStatus === 'pending' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This process typically takes 1-2 business days.
              </p>
              <Button 
                variant="outline" 
                onClick={refreshUserData}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Check Status
              </Button>
            </div>
          )}

          {user?.approvalStatus === 'approved' && (
            <div className="text-center">
              <Link to="/dashboard">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}

          {user?.approvalStatus === 'rejected' && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Please contact our support team for further assistance.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={signOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}