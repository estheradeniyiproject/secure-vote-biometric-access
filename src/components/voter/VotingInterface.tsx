
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Vote, User, FileText, BarChart3, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  name: string;
  party: string;
  bio: string;
  manifesto: string;
  photo_url: string;
  vote_count?: number;
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: 'upcoming' | 'active' | 'closed';
  start_date: string;
  end_date: string;
}

interface VotingInterfaceProps {
  election: Election;
  hasVoted: boolean;
  onVoteSuccess: () => void;
}

const VotingInterface = ({ election, hasVoted, onVoteSuccess }: VotingInterfaceProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
    if (election.status === 'active') {
      fetchLiveResults();
      const interval = setInterval(fetchLiveResults, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [election.id, election.status]);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', election.id)
        .order('name');

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchLiveResults = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_live_vote_counts', { election_uuid: election.id });

      if (error) throw error;

      const counts: Record<string, number> = {};
      let total = 0;

      (data || []).forEach((result: any) => {
        counts[result.candidate_id] = result.vote_count;
        total += result.vote_count;
      });

      setVoteCounts(counts);
      setTotalVotes(total);
    } catch (error) {
      console.error('Error fetching live results:', error);
    }
  };

  const handleVote = async (candidateId: string) => {
    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already cast your vote in this election",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);
    try {
      const { data, error } = await supabase
        .rpc('cast_vote', {
          election_uuid: election.id,
          candidate_uuid: candidateId
        });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        toast({
          title: "Vote Cast Successfully",
          description: "Your vote has been recorded",
          variant: "default"
        });
        onVoteSuccess();
        fetchLiveResults();
      } else {
        toast({
          title: "Voting Failed",
          description: result.error || "Failed to cast vote",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (candidateId: string) => {
    if (totalVotes === 0) return 0;
    return ((voteCounts[candidateId] || 0) / totalVotes) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{election.title}</h2>
        <p className="text-gray-600 mb-4">{election.description}</p>
        
        {election.status === 'active' && (
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Badge variant="default" className="bg-green-500">
              <Vote className="h-4 w-4 mr-1" />
              Election Active
            </Badge>
            {hasVoted && (
              <Badge variant="secondary">
                <CheckCircle className="h-4 w-4 mr-1" />
                You have voted
              </Badge>
            )}
            {election.status === 'active' && totalVotes > 0 && (
              <Badge variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                {totalVotes} votes cast
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const voteCount = voteCounts[candidate.id] || 0;
          const percentage = getVotePercentage(candidate.id);

          return (
            <Card key={candidate.id} className="relative overflow-hidden">
              <CardHeader className="text-center">
                <Avatar className="mx-auto h-20 w-20 mb-4">
                  <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{candidate.name}</CardTitle>
                <CardDescription>{candidate.party}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {candidate.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3">{candidate.bio}</p>
                )}

                {/* Live vote count for active elections */}
                {election.status === 'active' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Votes</span>
                      <span className="text-lg font-bold">{voteCount.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-gray-500 text-center">
                      {percentage.toFixed(1)}% of total votes
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-4 w-4 mr-1" />
                        Manifesto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{candidate.name}'s Manifesto</DialogTitle>
                        <DialogDescription>{candidate.party}</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <div className="prose prose-sm max-w-none">
                          {candidate.manifesto ? (
                            <div className="whitespace-pre-wrap">{candidate.manifesto}</div>
                          ) : (
                            <p className="text-gray-500 italic">No manifesto available</p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {election.status === 'active' && !hasVoted && (
                    <Button
                      onClick={() => handleVote(candidate.id)}
                      disabled={isVoting}
                      className="flex-1"
                    >
                      <Vote className="h-4 w-4 mr-1" />
                      {isVoting ? 'Voting...' : 'Vote'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No candidates found for this election</p>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;
