#!/usr/bin/env python3
"""
Teste simples do servidor Flask
"""

from flask import Flask, jsonify
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    return jsonify({
        "status": "healthy",
        "service": "APIBR2 Test Server",
        "message": "Server is running!"
    })

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        "message": "Test successful!",
        "timestamp": "2025-07-05T06:30:00Z"
    })

if __name__ == '__main__':
    logger.info("Starting test server on port 5001...")
    try:
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        print(f"Error: {e}") 