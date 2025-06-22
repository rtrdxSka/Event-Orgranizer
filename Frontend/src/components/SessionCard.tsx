import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, Trash2, Clock } from 'lucide-react';
import useDeleteSession from "@/hooks/useDeleteSession";
import { Session } from '@/types';

const SessionCard = ({ session }: { session: Session }) => {
  const { _id, createdAt, userAgent, isCurrent } = session;
  const { deleteSession, isPending } = useDeleteSession(_id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/80 via-indigo-800/60 to-violet-900/80 border border-purple-600/40 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/60 group">
      {/* Enhanced Card Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(79,70,229,0.15),transparent_50%)]"></div>
      
      {/* Content layer */}
      <div className="relative z-10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg">
                <Laptop className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-white">
                  {userAgent}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-purple-200 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(createdAt)}</span>
                </div>
              </div>
            </div>

            {!isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => deleteSession()}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default SessionCard;