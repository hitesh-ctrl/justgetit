import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CATEGORIES, CAMPUS_LOCATIONS, type Category, type CampusLocation } from '@/types';
import { useCreateNeedRequest } from '@/hooks/useNeedRequests';
import Layout from '@/components/Layout';

export default function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createRequest = useCreateNeedRequest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [preferredLocation, setPreferredLocation] = useState<CampusLocation | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'Please log in to create a request.',
      });
      return;
    }

    if (!category || !preferredLocation) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please select a category and preferred location.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await createRequest.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        maxBudget: parseFloat(maxBudget),
        category: category as Category,
        preferredLocation: preferredLocation as CampusLocation,
      });

      toast({
        title: 'Request posted!',
        description: "Sellers will be able to see what you're looking for.",
      });

      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create request',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-needing" />
              Post What You Need
            </CardTitle>
            <CardDescription>
              Let sellers know what you're looking for
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">What are you looking for?</Label>
                <Input
                  id="title"
                  placeholder="e.g., Used cycle for campus commute"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you need, preferred condition, specific requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Budget and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Max Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="1000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Preferred Meeting Location</Label>
                <Select value={preferredLocation} onValueChange={(v) => setPreferredLocation(v as CampusLocation)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus location" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>⏰ Your request will expire in 7 days</p>
                <p className="mt-1">📬 You'll be notified when someone has a matching item</p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Request'
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
