
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, RefreshCw, Users, Vote, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface VoteCount {
  candidate_id: string;
  candidate_name: string;
  vote_count: number;
}

interface CandidateWithVotes extends VoteCount {
  party?: string;
  photo_url?: string;
  bio?: string;
}

interface Election {
  id: string;
  title: string;
  status: string;
}

const LiveResults = () => {
  const [results, setResults] = useState<CandidateWithVotes[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults();
      const interval = setInterval(fetchResults, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const { data } = await supabase
        .from('elections')
        .select('id, title, status')
        .order('created_at', { ascending: false });

      if (data) {
        setElections(data);
        // Auto-select the first active election or the first election
        const activeElection = data.find(e => e.status === 'active');
        const defaultElection = activeElection || data[0];
        if (defaultElection) {
          setSelectedElection(defaultElection.id);
        }
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const fetchResults = async () => {
    if (!selectedElection) return;

    setRefreshing(true);
    try {
      // Get live vote counts
      const { data: voteCounts, error } = await supabase
        .rpc('get_live_vote_counts', { election_uuid: selectedElection });

      if (error) throw error;

      // Get candidate details
      const { data: candidates } = await supabase
        .from('candidates')
        .select('id, name, party, photo_url, bio')
        .eq('election_id', selectedElection);

      // Merge vote counts with candidate details
      const resultsWithDetails = (voteCounts || []).map((vote: VoteCount) => {
        const candidate = candidates?.find(c => c.id === vote.candidate_id);
        return {
          ...vote,
          party: candidate?.party,
          photo_url: candidate?.photo_url,
          bio: candidate?.bio
        };
      });

      // Sort by vote count descending
      resultsWithDetails.sort((a, b) => b.vote_count - a.vote_count);

      setResults(resultsWithDetails);
      setTotalVotes(resultsWithDetails.reduce((sum, result) => sum + result.vote_count, 0));
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getWinnerBadge = (index: number, voteCount: number) => {
    if (totalVotes === 0) return null;
    
    if (index === 0 && voteCount > 0) {
      return <Badge className="bg-gold text-yellow-900">🏆 Leading</Badge>;
    } else if (index === 1 && voteCount > 0) {
      return <Badge variant="secondary">🥈 2nd Place</Badge>;
    } else if (index === 2 && voteCount > 0) {
      return <Badge variant="secondary">🥉 3rd Place</Badge>;
    }
    return null;
  };

  if (loading && !selectedElection) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading elections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Election Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Live Election Results
          </h2>
          {elections.length > 1 && (
            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="px-3 py-1 border rounded-md"
            >
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title} ({election.status})
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {totalVotes > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{totalVotes.toLocaleString()} total votes</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={fetchResults} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {results.map((result, index) => {
          const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0;
          
          return (
            <Card key={result.candidate_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={result.photo_url || undefined} alt={result.candidate_name} />
                        <AvatarFallback>
                          {result.candidate_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && result.vote_count > 0 && (
                        <div className="absolute -top-2 -right-2 text-2xl">🏆</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold">{result.candidate_name}</h3>
                        {getWinnerBadge(index, result.vote_count)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{result.party}</p>
                      {result.bio && (
                        <p className="text-xs text-gray-500 line-clamp-2">{result.bio}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Vote className="h-4 w-4 text-gray-400" />
                      <p className="text-3xl font-bold">{result.vote_count.toLocaleString()}</p>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">{percentage.toFixed(1)}%</p>
                    {index === 0 && totalVotes > 0 && (
                      <div className="flex items-center text-xs text-green-600 mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Leading
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Vote Share</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {results.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No votes cast yet</p>
                <p className="text-sm">Results will appear here once voting begins</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveResults;
