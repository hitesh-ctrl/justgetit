import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { needRequestStorage, userStorage, matchStorage, generateId, notificationStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Star, Clock, Package } from 'lucide-react';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const request = id ? needRequestStorage.getById(id) : null;
  const requester = request ? userStorage.getUserById(request.userId) : null;

  if (!request) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Request not found</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go back home
          </Button>
        </div>
      </Layout>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === request.category)?.label || request.category;
  const locationLabel = CAMPUS_LOCATIONS.find((l) => l.value === request.preferredLocation)?.label || request.preferredLocation;
  const isOwner = user?.id === request.userId;
  const expiresIn = formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true });
  const isExpiringSoon = new Date(request.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOffer = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if match already exists
    const existingMatches = matchStorage.getByUserId(user.id);
    const alreadyMatched = existingMatches.some(
      (m) => m.needRequestId === request.id && m.sellerId === user.id
    );

    if (alreadyMatched) {
      toast({
        title: 'Already offered',
        description: 'You have already offered to help with this request.',
      });
      return;
    }

    // Create match
    const match = {
      id: generateId(),
      needRequestId: request.id,
      sellerId: user.id,
      buyerId: request.userId,
      status: 'pending' as const,
      matchScore: 100,
      suggestedLocation: request.preferredLocation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    matchStorage.save(match);

    // Notify requester
    notificationStorage.save({
      id: generateId(),
      userId: request.userId,
      type: 'match',
      title: 'Someone has what you need!',
      message: `${user.name} might have "${request.title}"`,
      read: false,
      linkTo: '/matches',
      createdAt: new Date().toISOString(),
    });

    toast({
      title: 'Offer sent!',
      description: 'The requester will be notified. Check your matches to connect.',
    });

    navigate('/matches');
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
          <CardContent className="p-6 space-y-6">
            <div>
              <Badge className="bg-needing text-needing-foreground mb-3">
                NEEDING
              </Badge>
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <p className="text-3xl font-bold text-primary mt-2">
                Up to ₹{request.maxBudget}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 ${isExpiringSoon ? 'border-warning text-warning' : ''}`}
              >
                <Clock className="h-3 w-3" />
                Expires {expiresIn}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What they're looking for</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {/* Requester Info */}
            {requester && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={requester.profilePhoto} />
                      <AvatarFallback className="bg-needing text-needing-foreground">
                        {getInitials(requester.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{requester.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {requester.trustScore > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {requester.trustScore}
                          </span>
                        )}
                        <span>{requester.totalExchanges} exchanges</span>
                      </div>
                    </div>
                    <Badge
                      className={
                        requester.badge === 'top'
                          ? 'bg-warning text-warning-foreground'
                          : requester.badge === 'trusted'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {requester.badge === 'top'
                        ? '⭐ Top'
                        : requester.badge === 'trusted'
                        ? '✓ Trusted'
                        : 'New'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isOwner ? (
              <Button className="w-full" variant="outline" disabled>
                This is your request
              </Button>
            ) : (
              <Button className="w-full" size="lg" onClick={handleOffer}>
                <Package className="h-4 w-4 mr-2" />
                I Have This Item
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
