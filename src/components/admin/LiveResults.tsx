
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VoteCount {
  candidate_id: string;
  candidate_name: string;
  vote_count: number;
}

interface CandidateWithVotes extends VoteCount {
  party?: string;
  photo_url?: string;
}

const LiveResults = () => {
  const [results, setResults] = useState<CandidateWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      // Get the active election
      const { data: elections } = await supabase
        .from('elections')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      if (!elections || elections.length === 0) {
        setResults([]);
        setTotalVotes(0);
        return;
      }

      // Get live vote counts
      const { data: voteCounts, error } = await supabase
        .rpc('get_live_vote_counts', { election_uuid: elections[0].id });

      if (error) throw error;

      // Get candidate details
      const { data: candidates } = await supabase
        .from('candidates')
        .select('id, name, party, photo_url')
        .eq('election_id', elections[0].id);

      // Merge vote counts with candidate details
      const resultsWithDetails = (voteCounts || []).map((vote: VoteCount) => {
        const candidate = candidates?.find(c => c.id === vote.candidate_id);
        return {
          ...vote,
          party: candidate?.party,
          photo_url: candidate?.photo_url
        };
      });

      setResults(resultsWithDetails);
      setTotalVotes(resultsWithDetails.reduce((sum, result) => sum + result.vote_count, 0));
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading results...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Live Election Results
        </h2>
        <Button variant="outline" size="sm" onClick={fetchResults}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {results.map((result) => {
          const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0;
          
          return (
            <Card key={result.candidate_id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={result.photo_url || undefined} alt={result.candidate_name} />
                      <AvatarFallback>
                        {result.candidate_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{result.candidate_name}</h3>
                      <p className="text-sm text-gray-600">{result.party}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{result.vote_count.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
              </CardContent>
            </Card>
          );
        })}
        
        {results.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                No active election or candidates found
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveResults;
