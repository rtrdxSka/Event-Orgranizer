import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUser } from '@/lib/api';
import { updateUserSchema, UpdateUserInput } from '@/lib/validations/user.schemas';
import { User } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type UpdateUserError = {
  message: string;
  status: number;
};

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Form setup with react-hook-form and zod
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutate: updateUserMutation, isPending } = useMutation({
    mutationFn: updateUser,
    onSuccess: (response) => {
      setErrorMessage('');
      
      // Update the user in the React Query cache
      queryClient.setQueryData(['user'], response.data.user);
      
      // Show success toast
      toast.success('Profile Updated', {
        description: response.message,
        duration: 5000,
      });
      
      // Close modal and reset form
      onClose();
      form.reset({ 
        email: response.data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: UpdateUserError) => {
      setErrorMessage(error.message);
      // Clear password fields on error
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
      form.setValue('confirmPassword', '');
    },
  });

  const onSubmit = (data: UpdateUserInput) => {
    setErrorMessage('');
    
    // Check if anything actually changed
    const emailChanged = data.email !== user.email;
    const passwordProvided = data.currentPassword || data.newPassword || data.confirmPassword;
    
    if (!emailChanged && !passwordProvided) {
      toast.info('No changes detected', {
        description: 'Please make changes to your profile before submitting.',
      });
      return;
    }
    
    // Prepare the data to send (only include non-empty fields)
    const updateData: Partial<UpdateUserInput> = {};
    
    if (emailChanged) {
      updateData.email = data.email;
    }
    
    if (passwordProvided) {
      updateData.currentPassword = data.currentPassword;
      updateData.newPassword = data.newPassword;
      updateData.confirmPassword = data.confirmPassword;
    }
    
    updateUserMutation(updateData);
  };

  const handleClose = () => {
    if (!isPending) {
      setErrorMessage('');
      form.reset({ 
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
    if (field === 'new') setShowNewPassword(!showNewPassword);
    if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-purple-900 border-purple-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-100 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Profile
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            Update your email address and/or password. You can change one or both.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Section */}
            <div className="space-y-4">
              <h3 className="text-purple-200 font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </h3>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-200">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        className="bg-purple-800/50 border-purple-600 text-purple-100 placeholder:text-purple-400 focus:border-purple-500"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Section */}
            <div className="space-y-4 border-t border-purple-700/50 pt-4">
              <h3 className="text-purple-200 font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password (Optional)
              </h3>
              
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-200">Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                          className="bg-purple-800/50 border-purple-600 text-purple-100 placeholder:text-purple-400 focus:border-purple-500 pr-10"
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                          disabled={isPending}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-purple-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-200">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter your new password (min. 6 characters)"
                          className="bg-purple-800/50 border-purple-600 text-purple-100 placeholder:text-purple-400 focus:border-purple-500 pr-10"
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                          disabled={isPending}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-purple-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-200">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          className="bg-purple-800/50 border-purple-600 text-purple-100 placeholder:text-purple-400 focus:border-purple-500 pr-10"
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                          disabled={isPending}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-purple-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {!user.verified && (
              <Alert className="border-yellow-500 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  Your current email is not verified. Updating to a new email will require verification.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                className="text-purple-300 hover:text-purple-100 hover:bg-purple-800/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProfileModal;