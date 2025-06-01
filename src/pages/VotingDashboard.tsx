
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Vote, Clock, CheckCircle, User, LogOut, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Election = Tables<'elections'>;
type Candidate = Tables<'candidates'>;

interface EligibleElection extends Election {
  has_voted: boolean;
  candidates?: Candidate[];
}

const VotingDashboard = () => {
  const [elections, setElections] = useState<EligibleElection[]>([]);
  const [selectedElection, setSelectedElection] = useState<EligibleElection | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchEligibleElections();
    }
  }, [user]);

  const fetchEligibleElections = async () => {
    if (!user) return;

    try {
      // Get eligible elections using the stored function
      const { data: eligibleElections, error: electionsError } = await supabase
        .rpc('get_eligible_elections', { voter_uuid: user.id });

      if (electionsError) throw electionsError;

      // Fetch candidates for each election and merge with election data
      const electionsWithCandidates = await Promise.all(
        (eligibleElections || []).map(async (election) => {
          const { data: candidates } = await supabase
            .from('candidates')
            .select('*')
            .eq('election_id', election.id)
            .order('name');

          // Get full election data to ensure all properties are included
          const { data: fullElection } = await supabase
            .from('elections')
            .select('*')
            .eq('id', election.id)
            .single();

          return {
            ...fullElection,
            has_voted: election.has_voted,
            candidates: candidates || []
          } as EligibleElection;
        })
      );

      setElections(electionsWithCandidates);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available elections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedElection || !selectedCandidate || !user) return;

    setVoting(true);
    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          voter_id: user.id,
          candidate_id: selectedCandidate,
          election_id: selectedElection.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You have already voted in this election');
        }
        throw error;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        action_text: 'VOTE_CAST',
        details_json: { 
          election_id: selectedElection.id,
          candidate_id: selectedCandidate 
        }
      });

      toast({
        title: "Vote Cast Successfully! 🗳️",
        description: `Your vote has been recorded for ${selectedElection.title}`,
      });

      // Refresh elections to update voting status
      fetchEligibleElections();
      setShowConfirmDialog(false);
      setSelectedElection(null);
      setSelectedCandidate(null);
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast({
        title: "Voting Failed",
        description: error.message || "Failed to cast vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVoting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const openVotingDialog = (election: EligibleElection) => {
    setSelectedElection(election);
    setSelectedCandidate(null);
  };

  const confirmVote = () => {
    if (!selectedCandidate) {
      toast({
        title: "No Candidate Selected",
        description: "Please select a candidate before voting",
        variant: "destructive"
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your voting dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Vote className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Voter Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Available Elections</h2>
          <p className="text-gray-600">Click on an election to view candidates and cast your vote</p>
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Elections</h3>
              <p className="text-gray-600">There are no active elections available for voting at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {elections.map((election) => (
              <Card key={election.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{election.title}</CardTitle>
                      <CardDescription className="mt-2">{election.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={election.has_voted ? "default" : "secondary"}>
                        {election.has_voted ? "Voted" : "Not Voted"}
                      </Badge>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Ends: {new Date(election.end_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {election.candidates?.length || 0} candidates available
                    </div>
                    {election.has_voted ? (
                      <Button disabled className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote Cast
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => openVotingDialog(election)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Vote className="h-4 w-4 mr-2" />
                        View Candidates & Vote
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Voting Dialog */}
      <Dialog open={!!selectedElection} onOpenChange={() => setSelectedElection(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedElection?.title}</DialogTitle>
            <DialogDescription>
              Select a candidate to cast your vote. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedElection?.candidates?.map((candidate) => (
              <div
                key={candidate.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedCandidate === candidate.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCandidate(candidate.id)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={candidate.photo_url || undefined} alt={candidate.name} />
                    <AvatarFallback>
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <p className="text-gray-600">{candidate.party}</p>
                    {candidate.bio && (
                      <p className="text-sm text-gray-500 mt-1">{candidate.bio}</p>
                    )}
                  </div>
                  {selectedCandidate === candidate.id && (
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedElection(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmVote}
              disabled={!selectedCandidate}
              className="bg-green-600 hover:bg-green-700"
            >
              Cast Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              Are you sure you want to cast your vote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg">
              You are voting for: <strong>
                {selectedElection?.candidates?.find(c => c.id === selectedCandidate)?.name}
              </strong>
            </p>
            <p className="text-center text-sm text-gray-600 mt-2">
              in the election: <strong>{selectedElection?.title}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVote}
              disabled={voting}
              className="bg-green-600 hover:bg-green-700"
            >
              {voting ? 'Casting Vote...' : 'Confirm Vote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VotingDashboard;
