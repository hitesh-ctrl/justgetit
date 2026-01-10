import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  matchStorage,
  messageStorage,
  userStorage,
  listingStorage,
  needRequestStorage,
  generateId,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, MapPin, CheckCircle2, Calendar } from 'lucide-react';
import { CAMPUS_LOCATIONS } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ReturnType<typeof messageStorage.getByMatchId>>([]);

  const match = matchId ? matchStorage.getById(matchId) : null;
  const otherUserId = match
    ? match.sellerId === user?.id
      ? match.buyerId
      : match.sellerId
    : null;
  const otherUser = otherUserId ? userStorage.getUserById(otherUserId) : null;
  const listing = match?.listingId ? listingStorage.getById(match.listingId) : null;
  const request = match?.needRequestId ? needRequestStorage.getById(match.needRequestId) : null;
  const locationLabel = match
    ? CAMPUS_LOCATIONS.find((l) => l.value === match.suggestedLocation)?.label || match.suggestedLocation
    : '';

  useEffect(() => {
    if (matchId) {
      setMessages(messageStorage.getByMatchId(matchId));
    }
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!match || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chat not found</p>
          <Button className="mt-4" onClick={() => navigate('/matches')}>
            View Matches
          </Button>
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: generateId(),
      matchId: match.id,
      senderId: user.id,
      content: newMessage.trim(),
      isSystemMessage: false,
      createdAt: new Date().toISOString(),
    };

    messageStorage.save(message);
    setMessages([...messages, message]);
    setNewMessage('');

    // Update match status to chatting if pending
    if (match.status === 'pending') {
      matchStorage.save({ ...match, status: 'chatting', updatedAt: new Date().toISOString() });
    }
  };

  const handleScheduleMeeting = () => {
    const systemMessage = {
      id: generateId(),
      matchId: match.id,
      senderId: 'system',
      content: `📍 Suggested meeting point: ${locationLabel}\n\n${user.name} wants to schedule a meeting. Please confirm a date and time.`,
      isSystemMessage: true,
      createdAt: new Date().toISOString(),
    };

    messageStorage.save(systemMessage);
    setMessages([...messages, systemMessage]);

    matchStorage.save({
      ...match,
      status: 'meeting-scheduled',
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: 'Meeting suggested',
      description: 'Coordinate with the other person for the exact time.',
    });
  };

  const handleCompleteExchange = () => {
    matchStorage.save({
      ...match,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    const systemMessage = {
      id: generateId(),
      matchId: match.id,
      senderId: 'system',
      content: '✅ Exchange marked as completed! Don\'t forget to rate each other.',
      isSystemMessage: true,
      createdAt: new Date().toISOString(),
    };

    messageStorage.save(systemMessage);
    setMessages([...messages, systemMessage]);

    toast({
      title: 'Exchange completed!',
      description: 'You can now rate each other.',
    });

    navigate(`/rate/${match.id}`);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherUser ? getInitials(otherUser.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{otherUser?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {listing?.title || request?.title || 'Exchange'}
            </p>
          </div>
          <Badge
            className={
              match.status === 'completed'
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground'
            }
          >
            {match.status === 'completed'
              ? 'Completed'
              : match.status === 'meeting-scheduled'
              ? 'Meeting Set'
              : 'Active'}
          </Badge>
        </div>

        {/* Exchange Info Card */}
        <Card className="mt-4">
          <CardContent className="p-3 flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Suggested meeting: <strong>{locationLabel}</strong></span>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet</p>
              <p className="text-sm">Say hello to start the conversation!</p>
            </div>
          )}
          {messages.map((message) => {
            const isOwn = message.senderId === user.id;
            const isSystem = message.isSystemMessage;

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-secondary px-4 py-2 rounded-lg text-sm text-center max-w-[80%] whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary rounded-bl-md'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {match.status !== 'completed' && (
          <div className="flex gap-2 pb-4">
            {match.status !== 'meeting-scheduled' && (
              <Button variant="outline" size="sm" onClick={handleScheduleMeeting}>
                <Calendar className="h-4 w-4 mr-1" />
                Schedule Meeting
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCompleteExchange}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete Exchange
            </Button>
          </div>
        )}

        {/* Message Input */}
        {match.status !== 'completed' && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}

        {match.status === 'completed' && (
          <Button className="w-full" onClick={() => navigate(`/rate/${match.id}`)}>
            Rate This Exchange
          </Button>
        )}
      </div>
    </Layout>
  );
}
