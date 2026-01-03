import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star } from 'lucide-react';
import type { Listing } from '@/types';
import { userStorage } from '@/lib/storage';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/types';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();
  const seller = userStorage.getUserById(listing.userId);

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label || listing.category;
  const locationLabel = CAMPUS_LOCATIONS.find((l) => l.value === listing.location)?.label || listing.location;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={() => navigate(`/listing/${listing.id}`)}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-selling text-selling-foreground">
          SELLING
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
            <span className="text-lg font-bold text-primary whitespace-nowrap">
              ₹{listing.price}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />
              {locationLabel}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {seller && (
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={seller.profilePhoto} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(seller.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {seller.name}
            </span>
            {seller.trustScore > 0 && (
              <span className="text-xs flex items-center gap-0.5 ml-auto">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {seller.trustScore}
              </span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
