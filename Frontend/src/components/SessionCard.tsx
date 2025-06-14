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
    <Card className="bg-purple-900/40 border-purple-700/50 hover:bg-purple-900/60 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-800/50 rounded-lg">
              <Laptop className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="font-medium text-purple-100">
                {userAgent}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Current Session
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-purple-300 mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </div>
          
          {!isCurrent && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => deleteSession()}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;