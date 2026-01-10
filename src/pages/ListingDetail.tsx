import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { listingStorage, userStorage, matchStorage, generateId, notificationStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Star, MessageSquare, Heart, Share2 } from 'lucide-react';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const listing = id ? listingStorage.getById(id) : null;
  const seller = listing ? userStorage.getUserById(listing.userId) : null;

  if (!listing) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Listing not found</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Go back home
          </Button>
        </div>
      </Layout>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label || listing.category;
  const locationLabel = CAMPUS_LOCATIONS.find((l) => l.value === listing.location)?.label || listing.location;
  const isOwner = user?.id === listing.userId;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInterest = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if match already exists
    const existingMatches = matchStorage.getByUserId(user.id);
    const alreadyMatched = existingMatches.some(
      (m) => m.listingId === listing.id && m.buyerId === user.id
    );

    if (alreadyMatched) {
      toast({
        title: 'Already interested',
        description: 'You have already shown interest in this listing.',
      });
      return;
    }

    // Create match
    const match = {
      id: generateId(),
      listingId: listing.id,
      sellerId: listing.userId,
      buyerId: user.id,
      status: 'pending' as const,
      matchScore: 100,
      suggestedLocation: listing.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    matchStorage.save(match);

    // Notify seller
    notificationStorage.save({
      id: generateId(),
      userId: listing.userId,
      type: 'match',
      title: 'New Interest!',
      message: `${user.name} is interested in "${listing.title}"`,
      read: false,
      linkTo: '/matches',
      createdAt: new Date().toISOString(),
    });

    toast({
      title: 'Interest sent!',
      description: 'The seller will be notified. Check your matches to connect.',
    });

    navigate('/matches');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {listing.images.length > 0 ? (
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-selling text-selling-foreground mb-3">
                SELLING
              </Badge>
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              <p className="text-3xl font-bold text-primary mt-2">
                ₹{listing.price}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </Badge>
              <Badge variant="outline">
                Posted {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Seller Info */}
            {seller && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={seller.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(seller.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{seller.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {seller.trustScore > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {seller.trustScore}
                          </span>
                        )}
                        <span>{seller.totalExchanges} exchanges</span>
                      </div>
                    </div>
                    <Badge
                      className={
                        seller.badge === 'top-seller'
                          ? 'bg-warning text-warning-foreground'
                          : seller.badge === 'trusted'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {seller.badge === 'top-seller'
                        ? '⭐ Top'
                        : seller.badge === 'trusted'
                        ? '✓ Trusted'
                        : 'New'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isOwner ? (
                <Button className="flex-1" variant="outline" disabled>
                  This is your listing
                </Button>
              ) : (
                <Button className="flex-1" size="lg" onClick={handleInterest}>
                  <Heart className="h-4 w-4 mr-2" />
                  I'm Interested
                </Button>
              )}
              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
