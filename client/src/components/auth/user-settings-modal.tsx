import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/hooks/useAuth';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

async function updateUserSettings(username: string) {
  const response = await fetch('/api/auth/user/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: username.trim() || null }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

export function UserSettingsModal({ isOpen, onClose, user }: UserSettingsModalProps) {
  const [username, setUsername] = useState(user?.username || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (updatedUser) => {
      // Update the user cache
      queryClient.setQueryData(['auth-user'], updatedUser);
      toast({
        title: "Settings updated",
        description: "Your username has been saved successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    if (username.length > 0) {
      if (username.length < 3 || username.length > 20) {
        toast({
          title: "Invalid username",
          description: "Username must be between 3 and 20 characters.",
          variant: "destructive",
        });
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast({
          title: "Invalid username",
          description: "Username can only contain letters, numbers, and underscores.",
          variant: "destructive",
        });
        return;
      }
    }

    updateMutation.mutate(username);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="user-settings-modal">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Update your account settings. Your username will be displayed when you post reactions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={user?.name || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Display name is managed by your OAuth provider.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username (Optional)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username for anonymous posting"
              data-testid="input-username"
            />
            <p className="text-xs text-muted-foreground">
              If set, your username will be shown instead of your display name in leaderboards and when posting reactions.
              Leave empty to use your display name. Must be 3-20 characters, letters, numbers, and underscores only.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}