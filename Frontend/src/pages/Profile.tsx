import React, { useState } from 'react';
import { Session, User} from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, AlertTriangle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Navbar from '@/components/NavBar';
import useSessions from '@/hooks/useSessions';
import SessionCard from '@/components/SessionCard';
import UpdateProfileModal from '@/components/UpdateUserComponents/UpdateProfileModal';

const Profile = () => {
  const { user } = useAuth();

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
 
  const { email, verified, createdAt } = user as User;
  const {sessions = [], isPending, isError} = useSessions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-purple-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-24">
        {/* Email Verification Alert */}
        {!verified && (
          <Alert className="mb-12 border-yellow-500 bg-yellow-500/10 text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-yellow-500">Verification Required</AlertTitle>
            <AlertDescription className="text-yellow-400">
              Please verify your email address to access all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Section */}
        <Card className="bg-gradient-to-br from-purple-900 to-blue-900/80 border-purple-700/50">
          <CardHeader className="flex flex-col md:flex-row items-center gap-8 pb-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-purple-800/50 border-2 border-purple-400">
                <img
                  src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* <div className="absolute bottom-0 right-0">
                <Button 
                  size="sm" 
                  className="rounded-full bg-purple-200 text-purple-950 hover:bg-purple-100"
                >
                  Edit
                </Button>
              </div> */}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-purple-100 text-center md:text-left mb-4">
                {email.split('@')[0]}
              </CardTitle>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-200">
                  <Mail className="w-5 h-5" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200">
                  <Calendar className="w-5 h-5" />
                  <span>Member since {formatDate(createdAt)}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50">
                <h3 className="text-xl font-semibold text-purple-100 mb-4">Account Status</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-purple-200">
                    {verified ? 'Verified Account' : 'Pending Verification'}
                  </span>
                </div>
              </div>

              <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50">
                <h3 className="text-xl font-semibold text-purple-100 mb-4">Account Settings</h3>
                <Button 
                onClick={() => setIsUpdateModalOpen(true)}
                  variant="secondary" 
                  className="bg-purple-200 text-purple-950 hover:bg-purple-100"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
                {/* Sessions Section */}
                <div className="mt-8">
          <h2 className="text-2xl font-bold text-purple-100 mb-6">Active Sessions</h2>
          {isPending ? (
            <div className="text-purple-200">Loading sessions...</div>
          ) : isError ? (
            <div className="text-red-400">Failed to load sessions</div>
          ) : (
            <div className="grid gap-4">
              {(sessions as Session[]).map((session) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>

        <UpdateProfileModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          user={user as User}
        />

      </div>
    </div>
  );
};

export default Profile;