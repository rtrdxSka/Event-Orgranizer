import React, { useState } from "react";
import { Session, User } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Calendar,
  AlertTriangle,
  Edit,
  Shield,
  User as UserIcon,
  CheckCircle,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/NavBar";
import useSessions from "@/hooks/useSessions";
import SessionCard from "@/components/SessionCard";
import UpdateProfileModal from "@/components/UpdateUserComponents/UpdateProfileModal";

const Profile = () => {
  const { user } = useAuth();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { email, verified, createdAt } = user as User;
  const { sessions = [], isPending, isError } = useSessions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        {/* Email Verification Alert */}
        {!verified && (
          <Alert className="mb-8 relative overflow-hidden bg-gradient-to-br from-purple-900/80 via-indigo-800/60 to-violet-900/80 border border-orange-500/40 backdrop-blur-xl shadow-xl">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-purple-600/20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.15),transparent_50%)]"></div>

            {/* Content */}
            <div className="relative z-10 flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-lg mt-0.5">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <AlertTitle className="text-white font-semibold text-lg mb-2">
                  Email Verification Required
                </AlertTitle>
                <AlertDescription className="text-purple-100 text-base leading-relaxed">
                  Please verify your email address to access all features and
                  secure your account.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Main Profile Card */}
        <Card className="mb-8 relative overflow-hidden bg-gradient-to-br from-purple-900/80 via-indigo-800/60 via-purple-800/70 to-violet-900/80 border border-purple-600/40 backdrop-blur-2xl shadow-2xl">
          {/* Enhanced Card Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.15),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(79,70,229,0.15),transparent_50%)]"></div>

          {/* Subtle animated elements within card */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl animate-pulse"></div>
          <div
            className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-indigo-400/5 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>

          {/* Content layer */}
          <div className="relative z-10">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Account Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-100 mb-4 flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full"></div>
                      Account Details
                    </h3>

                    <div className="space-y-4">
                      {/* Email Section */}
                      <div className="group p-4 bg-gradient-to-r from-purple-800/40 to-indigo-800/40 rounded-xl border border-purple-600/30 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-800/50 hover:to-indigo-800/50 transition-all duration-300 h-full">
                        <div className="flex items-start gap-4 h-full">
                          <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-purple-300 text-sm font-medium mb-1">
                                Email Address
                              </p>
                              <p className="text-white font-semibold text-lg">
                                {email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {verified ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                                  <span className="text-emerald-300 text-sm font-medium">
                                    Verified Account
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                  <span className="text-amber-300 text-sm font-medium">
                                    Pending Verification
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Member Since Section */}
                      <div className="group p-4 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-xl border border-indigo-600/30 hover:border-indigo-500/50 hover:bg-gradient-to-r hover:from-indigo-800/50 hover:to-purple-800/50 transition-all duration-300 h-full">
                        <div className="flex items-start gap-4 h-full">
                          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-indigo-300 text-sm font-medium mb-1">
                                Member Since
                              </p>
                              <p className="text-white font-semibold text-lg">
                                {formatDate(createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                              <span className="text-indigo-300 text-sm font-medium">
                                {Math.floor(
                                  (new Date().getTime() -
                                    new Date(createdAt).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days active
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Security */}
                <div className="space-y-6">
                  <div className="h-full bg-gradient-to-br from-purple-900/60 to-indigo-900/60 rounded-2xl p-6 border border-purple-600/40 backdrop-blur-sm shadow-xl">
                    <div className="h-full flex flex-col">
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          Account Security
                        </h3>
                        <p className="text-purple-200 text-base leading-relaxed">
                          Keep your account secure by updating your email
                          address or changing your password regularly. Regular
                          updates help protect against unauthorized access.
                        </p>
                      </div>

                      <div className="mt-auto">
                        <Button
                          onClick={() => setIsUpdateModalOpen(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <Edit className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                          Update Email & Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Sessions Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Active Sessions</h2>
          </div>

          {isPending ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-purple-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                Loading sessions...
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <div className="text-red-400 font-medium">
                Failed to load sessions
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {(sessions as Session[]).map((session) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Update Profile Modal */}
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
