
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserX, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

const VoterManagement = () => {
  const [voters, setVoters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoter, setSelectedVoter] = useState<Profile | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'voter')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoters(data || []);
    } catch (error) {
      console.error('Error fetching voters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch voters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockVoter = async (voterId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', voterId);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        action_text: currentStatus ? 'VOTER_BLOCKED' : 'VOTER_UNBLOCKED',
        details_json: { voter_id: voterId }
      });

      toast({
        title: "Success",
        description: `Voter ${currentStatus ? 'blocked' : 'unblocked'} successfully`
      });

      fetchVoters();
      setShowBlockDialog(false);
    } catch (error) {
      console.error('Error updating voter status:', error);
      toast({
        title: "Error",
        description: "Failed to update voter status",
        variant: "destructive"
      });
    }
  };

  const handleRemoveVoter = async (voterId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', voterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voter removed successfully"
      });

      fetchVoters();
      setShowBlockDialog(false);
    } catch (error) {
      console.error('Error removing voter:', error);
      toast({
        title: "Error",
        description: "Failed to remove voter",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading voters...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Voter Management
        </h2>
        <Badge variant="secondary">
          {voters.length} registered voters
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Voters</CardTitle>
          <CardDescription>
            Manage voter accounts and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell className="font-medium">
                    {voter.first_name} {voter.last_name}
                  </TableCell>
                  <TableCell>{voter.email}</TableCell>
                  <TableCell>{voter.national_id || 'Not provided'}</TableCell>
                  <TableCell>{voter.phone || 'Not provided'}</TableCell>
                  <TableCell>
                    <Badge variant={voter.is_verified ? 'default' : 'destructive'}>
                      {voter.is_verified ? 'Verified' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(voter.created_at!).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVoter(voter);
                          setShowBlockDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={voter.is_verified ? "destructive" : "default"}
                        onClick={() => handleBlockVoter(voter.id, voter.is_verified!)}
                      >
                        {voter.is_verified ? <UserX className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voter Details</DialogTitle>
            <DialogDescription>
              Manage voter account and verification status
            </DialogDescription>
          </DialogHeader>
          {selectedVoter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {selectedVoter.first_name} {selectedVoter.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedVoter.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedVoter.phone || 'Not provided'}
                </div>
                <div>
                  <strong>National ID:</strong> {selectedVoter.national_id || 'Not provided'}
                </div>
                <div>
                  <strong>Address:</strong> {selectedVoter.address || 'Not provided'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge variant={selectedVoter.is_verified ? 'default' : 'destructive'} className="ml-2">
                    {selectedVoter.is_verified ? 'Verified' : 'Blocked'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Close
            </Button>
            {selectedVoter && (
              <>
                <Button
                  variant={selectedVoter.is_verified ? "destructive" : "default"}
                  onClick={() => handleBlockVoter(selectedVoter.id, selectedVoter.is_verified!)}
                >
                  {selectedVoter.is_verified ? 'Block Voter' : 'Unblock Voter'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveVoter(selectedVoter.id)}
                >
                  Remove Voter
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoterManagement;
