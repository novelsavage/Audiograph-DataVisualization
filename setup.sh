#!/bin/bash

# Setup script for audiograph-network
# This script copies the JSON data file to the public folder

echo "Setting up audiograph-network..."

# Check if JSON file exists in parent directory
if [ -f "../spotify_featuring_network.json" ]; then
    echo "Copying spotify_featuring_network.json to public folder..."
    cp ../spotify_featuring_network.json public/
    echo "✓ JSON file copied successfully"
else
    echo "⚠ Warning: spotify_featuring_network.json not found in parent directory"
    echo "Please copy it manually to public/ folder"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure spotify_featuring_network.json is in public/ folder"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"

