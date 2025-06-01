
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Election = Tables<'elections'>;

const ElectionManagement = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'closed'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch elections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'upcoming'
    });
    setEditingElection(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingElection) {
        const { error } = await supabase
          .from('elections')
          .update(formData)
          .eq('id', editingElection.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Election updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('elections')
          .insert({
            ...formData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Election created successfully"
        });
      }

      fetchElections();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving election:', error);
      toast({
        title: "Error",
        description: "Failed to save election",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (electionId: string) => {
    if (!confirm('Are you sure you want to delete this election?')) return;

    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Election deleted successfully"
      });
      fetchElections();
    } catch (error) {
      console.error('Error deleting election:', error);
      toast({
        title: "Error",
        description: "Failed to delete election",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (election: Election) => {
    setEditingElection(election);
    setFormData({
      title: election.title,
      description: election.description || '',
      start_date: new Date(election.start_date).toISOString().slice(0, 16),
      end_date: new Date(election.end_date).toISOString().slice(0, 16),
      status: election.status || 'upcoming'
    });
    setShowDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading elections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Election Management
        </h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Election
        </Button>
      </div>

      <div className="grid gap-4">
        {elections.map((election) => (
          <Card key={election.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{election.title}</h3>
                    <Badge className={getStatusColor(election.status || 'upcoming')}>
                      {election.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600">{election.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Start: {new Date(election.start_date).toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      End: {new Date(election.end_date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(election)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(election.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingElection ? 'Edit Election' : 'Schedule New Election'}
            </DialogTitle>
            <DialogDescription>
              {editingElection ? 'Update election details' : 'Create a new election event'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Election Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Presidential Election 2024"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Election description and details"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date & Time</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'upcoming' | 'active' | 'closed') => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingElection ? 'Update Election' : 'Create Election'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ElectionManagement;
