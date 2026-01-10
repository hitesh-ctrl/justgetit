import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  matchStorage,
  userStorage,
  ratingStorage,
  generateId,
  notificationStorage,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Star, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

export default function RateExchange() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [overallRating, setOverallRating] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [itemAccuracy, setItemAccuracy] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const match = matchId ? matchStorage.getById(matchId) : null;
  const otherUserId = match
    ? match.sellerId === user?.id
      ? match.buyerId
      : match.sellerId
    : null;
  const otherUser = otherUserId ? userStorage.getUserById(otherUserId) : null;

  // Check if already rated
  const existingRatings = matchId ? ratingStorage.getByMatchId(matchId) : [];
  const hasRated = existingRatings.some((r) => r.fromUserId === user?.id);

  if (!match || !user || !otherUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Exchange not found</p>
          <Button className="mt-4" onClick={() => navigate('/matches')}>
            View Matches
          </Button>
        </div>
      </Layout>
    );
  }

  if (hasRated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-12">
          <Star className="h-16 w-16 mx-auto text-warning fill-warning mb-4" />
          <h1 className="text-2xl font-bold mb-2">Already Rated</h1>
          <p className="text-muted-foreground mb-6">
            You have already rated this exchange.
          </p>
          <Button onClick={() => navigate('/matches')}>Back to Matches</Button>
        </div>
      </Layout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? 'fill-warning text-warning'
                  : 'text-muted hover:text-warning/50'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating required',
        description: 'Please give an overall rating.',
      });
      return;
    }

    setIsLoading(true);

    const rating = {
      id: generateId(),
      matchId: match.id,
      fromUserId: user.id,
      toUserId: otherUserId!,
      overallRating,
      communication: communication || overallRating,
      itemAccuracy: itemAccuracy || overallRating,
      punctuality: punctuality || overallRating,
      review: review.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    ratingStorage.save(rating);

    // Notify the other user
    notificationStorage.save({
      id: generateId(),
      userId: otherUserId!,
      type: 'rating-reminder',
      title: 'You received a rating!',
      message: `${user.name} rated your exchange`,
      read: false,
      linkTo: '/profile',
      createdAt: new Date().toISOString(),
    });

    toast({
      title: 'Rating submitted!',
      description: 'Thank you for your feedback.',
    });

    navigate('/matches');
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto animate-fade-in">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-2">
              <AvatarImage src={otherUser.avatarUrl} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle>Rate {otherUser.name}</CardTitle>
            <CardDescription>
              How was your exchange experience?
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <StarRating
                value={overallRating}
                onChange={setOverallRating}
                label="Overall Rating *"
              />

              <div className="grid grid-cols-3 gap-4">
                <StarRating
                  value={communication}
                  onChange={setCommunication}
                  label="Communication"
                />
                <StarRating
                  value={itemAccuracy}
                  onChange={setItemAccuracy}
                  label="Item Accuracy"
                />
                <StarRating
                  value={punctuality}
                  onChange={setPunctuality}
                  label="Punctuality"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review">Review (optional)</Label>
                <Textarea
                  id="review"
                  placeholder="Share your experience..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || overallRating === 0}
              >
                {isLoading ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
