#!/bin/bash

# Direct curl command to override today's prompt
# Replace YOUR_CRON_SECRET with your actual secret

echo "🔄 Overriding today's prompt to solar panel..."

curl -X POST "https://dailybright.vercel.app/api/admin/override-prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Your day'\''s energy level: solar panel or dead battery? Why?",
    "secret": "YOUR_CRON_SECRET"
  }'

echo -e "\n✅ Override command sent!"
echo "Check your app - it should show the solar panel prompt now!"
