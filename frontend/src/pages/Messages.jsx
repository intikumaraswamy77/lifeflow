import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { formatDate, getBloodGroupColor, getUrgencyColor, getStatusColor, getAvailableBloodGroups } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  Heart, 
  Building2, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [requestDetails, setRequestDetails] = useState({
    bloodGroup: '',
    quantity: '',
    urgency: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConversations();
    
    // Handle starting a new conversation from search page
    if (location.state?.startConversation) {
      const { userId, userName, userType, bloodGroup } = location.state.startConversation;
      setSelectedConversation({
        _id: userId,
        partner: {
          _id: userId,
          name: userName,
          userType: userType,
          bloodGroup: bloodGroup
        },
        lastMessage: null,
        unreadCount: 0
      });
      setMessages([]);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.partner._id);
      // For donors and blood banks, keep compose mode to text only
      if (user.userType !== 'patient') {
        setMessageType('text');
      }
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch (error) {
      setError('Failed to load conversations');
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await apiClient.getMessages(userId);
      setMessages(data);
    } catch (error) {
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && messageType === 'text') return;
    if (!selectedConversation) return;

    setLoading(true);
    try {
      const messageData = {
        receiverId: selectedConversation.partner._id,
        message: newMessage.trim() || `Blood request: ${requestDetails.bloodGroup}${requestDetails.quantity ? ` - ${requestDetails.quantity} units` : ''}`,
        messageType,
        ...(messageType === 'request' && { requestDetails })
      };

      const sentMessage = await apiClient.sendMessage(messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setRequestDetails({ bloodGroup: '', quantity: '', urgency: 'medium' });
      setMessageType('text');
      
      // Update conversations list
      loadConversations();
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (messageId, status) => {
    try {
      const updatedMessage = await apiClient.updateMessageStatus(messageId, status);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? updatedMessage : msg
      ));
    } catch (error) {
      setError('Failed to update request status');
    }
  };

  const getUserIcon = (userType) => {
    switch (userType) {
      case 'patient':
        return <User className="h-4 w-4" />;
      case 'donor':
        return <Heart className="h-4 w-4" />;
      case 'bloodbank':
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-red-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-sm">{message.message}</div>
        
        {message.messageType === 'request' && message.requestDetails && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs ${getBloodGroupColor(message.requestDetails.bloodGroup)}`}>
                {message.requestDetails.bloodGroup}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${getUrgencyColor(message.requestDetails.urgency)}`}>
                {message.requestDetails.urgency}
              </span>
            </div>
            <div className="text-xs">
              Quantity: {message.requestDetails.quantity} units
            </div>
            <div className="flex items-center space-x-1">
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(message.requestDetails.status)}`}>
                {message.requestDetails.status}
              </span>
            </div>
            
            {/* Action buttons for receiver */}
            {!isOwn && message.requestDetails.status === 'pending' && (
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => updateRequestStatus(message._id, 'accepted')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => updateRequestStatus(message._id, 'rejected')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className={`text-xs mt-1 ${isOwn ? 'text-red-100' : 'text-gray-500'}`}>
          {formatDate(message.createdAt)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with donors, patients, and blood banks</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation._id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?._id === conversation._id ? 'bg-red-50' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getUserIcon(conversation.partner.userType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.partner.name || conversation.partner.bloodBankName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">
                          {conversation.partner.userType}
                          {conversation.partner.bloodGroup && ` • ${conversation.partner.bloodGroup}`}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {conversation.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center space-x-2">
                  {getUserIcon(selectedConversation.partner.userType)}
                  <span>{selectedConversation.partner.name || selectedConversation.partner.bloodBankName}</span>
                  <span className="text-sm text-gray-500 capitalize">
                    ({selectedConversation.partner.userType})
                  </span>
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 p-4">
                {user.userType !== 'patient' ? (
                  // Two-pane view for donors and blood banks: Texts (with compose) and Requests (with actions)
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Text Messages Pane */}
                    <div className="flex flex-col">
                      <div className="mb-2 font-semibold text-gray-900">Text Messages</div>
                      <div className="h-[280px] overflow-y-auto mb-3 border rounded-md p-3 bg-white">
                        {messages.filter(m => m.messageType !== 'request').length === 0 ? (
                          <div className="text-center text-gray-500 mt-8">No text messages yet.</div>
                        ) : (
                          messages
                            .filter(m => m.messageType !== 'request')
                            .map(message => (
                              <MessageBubble
                                key={message._id}
                                message={message}
                                isOwn={message.senderId._id === user._id}
                              />
                            ))
                        )}
                      </div>
                      {/* Compose Text Only */}
                      <div className="flex items-end gap-2">
                        <Textarea
                          placeholder={'Type your message...'}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button 
                          onClick={() => { if (!newMessage.trim()) return; setMessageType('text'); sendMessage(); }} 
                          disabled={loading || !newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Requests Pane */}
                    <div className="flex flex-col">
                      <div className="mb-2 font-semibold text-gray-900">Requests</div>
                      <div className="h-[335px] overflow-y-auto border rounded-md p-3 bg-white">
                        {messages.filter(m => m.messageType === 'request').length === 0 ? (
                          <div className="text-center text-gray-500 mt-8">No requests yet.</div>
                        ) : (
                          messages
                            .filter(m => m.messageType === 'request')
                            .map(message => (
                              <MessageBubble
                                key={message._id}
                                message={message}
                                isOwn={message.senderId._id === user._id}
                              />
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default single-pane view for patients/donors
                  <div className="space-y-4">
                    <div className="h-[350px] overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map(message => (
                          <MessageBubble
                            key={message._id}
                            message={message}
                            isOwn={message.senderId._id === user._id}
                          />
                        ))
                      )}
                    </div>

                    {/* Compose area (patients can send requests) */}
                    <div className="space-y-4">
                      {/* Message Type Selection */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={messageType === 'text' ? 'default' : 'outline'}
                          onClick={() => setMessageType('text')}
                        >
                          Text Message
                        </Button>
                        {user.userType === 'patient' && (
                          <Button
                            size="sm"
                            variant={messageType === 'request' ? 'default' : 'outline'}
                            onClick={() => setMessageType('request')}
                          >
                            Blood Request
                          </Button>
                        )}
                      </div>

                      {/* Blood Request Form */}
                      {messageType === 'request' && (
                        <div className={`grid gap-2 ${
                          selectedConversation?.partner?.userType === 'donor' 
                            ? 'grid-cols-2' 
                            : 'grid-cols-3'
                        }`}>
                          <Select 
                            value={requestDetails.bloodGroup} 
                            onValueChange={(value) => setRequestDetails(prev => ({ ...prev, bloodGroup: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Blood Group" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableBloodGroups(
                                selectedConversation?.partner?.userType,
                                selectedConversation?.partner?.bloodGroup
                              ).map(group => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Only show quantity for blood banks */}
                          {selectedConversation?.partner?.userType === 'bloodbank' && (
                            <Input
                              placeholder="Quantity"
                              value={requestDetails.quantity}
                              onChange={(e) => setRequestDetails(prev => ({ ...prev, quantity: e.target.value }))}
                            />
                          )}
                          
                          <Select 
                            value={requestDetails.urgency} 
                            onValueChange={(value) => setRequestDetails(prev => ({ ...prev, urgency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Message Input */}
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder={messageType === 'request' ? 'Additional message (optional)' : 'Type your message...'}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button 
                          onClick={sendMessage} 
                          disabled={loading || (messageType === 'text' && !newMessage.trim()) || (messageType === 'request' && (!requestDetails.bloodGroup || (selectedConversation?.partner?.userType === 'bloodbank' && !requestDetails.quantity)))}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;

