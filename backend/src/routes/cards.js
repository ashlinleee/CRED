import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import CreditCard from '../models/CreditCard.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all cards
router.get('/', async (req, res) => {
  try {
    const cards = await CreditCard.find({ user: req.user._id });
    res.json({ success: true, cards });
  } catch (error) {
    logger.error('Get cards error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cards' });
  }
});

// Add new card
router.post('/', async (req, res) => {
  try {
    const { cardName, cardNumber, expiryDate, cvv, bank, creditLimit } = req.body;
    logger.info('Adding new card:', { 
      cardName, 
      lastFourDigits: cardNumber.slice(-4),
      userId: req.user._id,
      cvv
    });

    const card = new CreditCard({
      user: req.user._id,
      cardName,
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv: cvv.toString(),
      bank,
      creditLimit: Number(creditLimit),
      availableCredit: Number(creditLimit)
    });

    await card.save();
    logger.info('Card added successfully');
    res.json({ success: true, message: 'Card added successfully' });
  } catch (error) {
    logger.error('Add card error:', error);
    res.status(500).json({ success: false, message: 'Failed to add card' });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    const { cvv } = req.body;
    const cardId = req.params.id;
    const userId = req.user._id;

    logger.info('Delete request received:', { 
      cardId,
      userId,
      cvvProvided: cvv
    });

    if (!cvv) {
      logger.warn('No CVV provided');
      return res.status(400).json({ success: false, message: 'CVV is required' });
    }

    const card = await CreditCard.findOne({ 
      _id: cardId,
      user: userId 
    });

    if (!card) {
      logger.warn('Card not found:', { cardId, userId });
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    logger.info('Card found:', { 
      cardId,
      storedCVV: card.cvv,
      providedCVV: cvv
    });

    if (card.cvv !== cvv.toString()) {
      logger.warn('CVV mismatch:', {
        storedCVV: card.cvv,
        providedCVV: cvv
      });
      return res.status(400).json({ success: false, message: 'Invalid CVV' });
    }

    await CreditCard.deleteOne({ _id: cardId, user: userId });
    logger.info('Card deleted successfully:', { cardId });
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    logger.error('Delete card error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete card' });
  }
});

export default router;
