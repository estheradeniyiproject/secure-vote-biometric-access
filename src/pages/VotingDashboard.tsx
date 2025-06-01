import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vote, Clock, Users, CheckCircle, AlertTriangle, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Election {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const VotingDashboard = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElections = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('elections')
          .select('*')
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching elections:', error);
          toast({
            title: "Error",
            description: "Failed to load elections",
            variant: "destructive"
          });
        } else {
          setElections(data || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchElections();
  }, [toast]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Vote className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voting Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Election Cards */}
        {isLoading ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Loading elections...
            </AlertDescription>
          </Alert>
        ) : elections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <Card key={election.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {election.is_active ? (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    {election.name}
                  </CardTitle>
                  <CardDescription>
                    {election.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Badge variant="secondary">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(election.start_date)} - {formatDate(election.end_date)}
                    </Badge>
                  </div>
                  <p>
                    {election.is_active ? (
                      <Button>
                        <Vote className="h-4 w-4 mr-2" />
                        Cast Your Vote
                      </Button>
                    ) : (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-yellow-800">
                          Election is not active
                        </AlertDescription>
                      </Alert>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              No elections available at the moment.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default VotingDashboard;
