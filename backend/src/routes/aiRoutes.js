/**
 * AI Routes
 * Handles AI-powered features including complaint categorization
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * @route POST /api/ai/categorize
 * @desc Categorize a complaint using AI with keyword fallback
 * @access Public
 */
router.post('/categorize', async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validate input
    if (!description && !title) {
      return res.status(400).json({
        error: 'Either title or description is required'
      });
    }

    console.log('[AI Route] Received categorization request:', { title, description: description?.substring(0, 50) });

    // Call AI service
    const result = await aiService.categorizeComplaint(title || '', description || '');

    console.log('[AI Route] Categorization result:', result);

    res.json(result);

  } catch (error) {
    console.error('[AI Route] Error:', error.message);
    
    // Return graceful error response
    res.status(500).json({
      error: 'Failed to categorize complaint',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/chat
 * @desc Chat with AI assistant (streaming)
 * @access Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required'
      });
    }

    console.log('[AI Route] Received chat request with', messages.length, 'messages');

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream chunks to client
    const onChunk = (chunk) => {
      res.write(`data: ${JSON.stringify({ 
        choices: [{ delta: { content: chunk } }] 
      })}\n\n`);
    };

    // Get complete response via streaming
    await aiService.streamChatResponse(messages, onChunk);

    // Send completion signal
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[AI Route] Chat error:', error.message);
    
    // Send error via SSE
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
