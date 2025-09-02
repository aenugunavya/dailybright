// Script to immediately override today's prompt to the solar panel one
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-here';

const overridePrompt = async () => {
  try {
    console.log('🔄 Overriding today\'s prompt to solar panel...');
    
    const response = await fetch('https://dailybright.vercel.app/api/admin/override-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        promptText: "Your day's energy level: solar panel or dead battery? Why?",
        secret: CRON_SECRET
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully overridden prompt!');
      console.log('New prompt:', result.prompt.text);
      console.log('Check your app - it should show the solar panel prompt now!');
    } else {
      console.error('❌ Override failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

overridePrompt();
