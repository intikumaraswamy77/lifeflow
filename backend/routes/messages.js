const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      {
        $unwind: '$partner'
      },
      {
        $project: {
          partner: {
            _id: 1,
            name: 1,
            userType: 1,
            bloodGroup: 1,
            phone: 1,
            bloodBankName: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get incoming blood requests for current user (e.g., blood bank)
// Optional query: ?status=pending|accepted|rejected|completed
router.get('/requests', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const match = {
      receiverId: req.user._id,
      messageType: 'request',
    };
    if (status) {
      match['requestDetails.status'] = status;
    }

    const requests = await Message.find(match)
      .sort({ createdAt: -1 })
      .populate('senderId', 'name userType bloodGroup phone')
      .populate('receiverId', 'name userType bloodBankName phone');

    res.json(requests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
});

// Get messages between current user and another user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('senderId', 'name userType phone bloodGroup')
    .populate('receiverId', 'name userType phone bloodGroup');

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text', requestDetails } = req.body;

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Enrich donation schedule requests so blood banks receive full details
    let enrichedDetails = requestDetails;
    if (messageType === 'request' && requestDetails && requestDetails.type === 'donation') {
      const sender = await User.findById(req.user._id).select('name phone bloodGroup');
      enrichedDetails = {
        urgency: 'low',
        status: 'pending',
        unit: requestDetails.unit || 'packets',
        notes: requestDetails.notes || '',
        donorName: requestDetails.donorName || sender?.name,
        donorPhone: requestDetails.donorPhone || sender?.phone,
        donorBloodGroup: requestDetails.donorBloodGroup || sender?.bloodGroup,
        bloodGroup: requestDetails.bloodGroup || sender?.bloodGroup,
        donationDate: requestDetails.donationDate,
        type: 'donation',
        quantity: requestDetails.quantity,
      };
    }

    const newMessage = new Message({
      senderId: req.user._id,
      receiverId,
      message,
      messageType,
      requestDetails: enrichedDetails
    });

    await newMessage.save();
    
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name userType')
      .populate('receiverId', 'name userType');

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('newMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error during message send' });
  }
});

// Update message status (for blood requests)
router.put('/:messageId/status', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only receiver can update request status
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this message' });
    }

    if (message.messageType !== 'request') {
      return res.status(400).json({ message: 'Can only update status of request messages' });
    }

    message.requestDetails.status = status;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name userType')
      .populate('receiverId', 'name userType');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(message.senderId.toString()).emit('messageStatusUpdate', populatedMessage);
    }

    res.json(populatedMessage);
  } catch (error) {
    console.error('Message status update error:', error);
    res.status(500).json({ message: 'Server error during status update' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

