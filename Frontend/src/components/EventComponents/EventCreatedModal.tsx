import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Link, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EventCreatedModalProps {
  isOpen: boolean;
  eventUUID: string;
  eventName: string;
  onClose: () => void;
}

const EventCreatedModal: React.FC<EventCreatedModalProps> = ({
  isOpen,
  eventUUID,
  eventName,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Create the full event submission URL
  const eventSubmitUrl = `${window.location.origin}/event/submit/${eventUUID}`;
  
  // Handle copy link button
  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventSubmitUrl);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Handle navigation to My Events page
  const handleGoToMyEvents = () => {
    onClose();
    navigate('/events'); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-purple-950 border border-purple-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-100">Event Created!</DialogTitle>
          <DialogDescription className="text-purple-200">
            Your event "{eventName}" has been created successfully.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-purple-900/50 rounded-lg border border-purple-700/50 my-4">
          <div className="flex items-center space-x-2 mb-2">
            <Link className="h-4 w-4 text-purple-300" />
            <h3 className="font-medium text-lg text-purple-100">Share Link</h3>
          </div>
          <p className="text-purple-200 mb-4 text-sm">
            Share this link with your participants. They'll be able to vote and provide their preferences.
          </p>
          
          <div className="flex space-x-2">
            <Input
              value={eventSubmitUrl}
              readOnly
              className="bg-purple-800/50 border-purple-600 text-purple-100"
            />
            <Button
              onClick={handleCopyLink}
              className={copied ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-500"}
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            variant="outline"
            className="border-purple-600 text-purple-200 hover:bg-purple-800 hover:text-purple-100"
            onClick={onClose}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Create Another Event
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-500 text-white mt-2 sm:mt-0"
            onClick={handleGoToMyEvents}
          >
            Go to My Events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreatedModal;