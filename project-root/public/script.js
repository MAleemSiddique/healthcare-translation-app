// script.js

// Ensure browser compatibility
if (!('webkitSpeechRecognition' in window)) {
  alert('Speech Recognition is not supported in your browser. Please try Chrome or Edge.');
} else {
  // Get the language selected by the user
  const languageSelect = document.getElementById('language-select');
  const recognition = new webkitSpeechRecognition();
  recognition.lang = languageSelect.value; // Default language
  recognition.interimResults = true;
  recognition.continuous = false;

  const speakButton = document.getElementById('speak-button');
  const transcriptArea = document.getElementById('transcript');
  const status = document.getElementById('status');
  console.log('Supported languages:', webkitSpeechRecognition.lang);
// Event listener for the when the user presses the speak button
  speakButton.addEventListener('click', () => {
    recognition.start(); // start the recognition
    status.textContent = 'Listening... Speak now!';
    speakButton.disabled = true;
  });

  recognition.onresult = (event) => { // script to show the results in the transcript area
    let finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      finalTranscript += event.results[i][0].transcript;
    }
    transcriptArea.value = finalTranscript;
  };

  recognition.onend = () => { // when the user stops speaking
    status.textContent = 'Click the button to start speaking...';
    speakButton.disabled = false;
  };

  recognition.onerror = (event) => { // in case an error is faced during the speaking
    console.error('Speech recognition error:', event.error);
    status.textContent = `Error: ${event.error}`;
    speakButton.disabled = false;
  };
}

// Add translation functionality
const translateButton = document.getElementById('translateButton');
const targetLanguageSelect = document.getElementById('Targetlanguage');
const translationOutput = document.getElementById('translation-output');
const playAudioButton = document.getElementById('play-audio-button'); // New button
// Event listener for when the translate button is pressed
translateButton.addEventListener('click', async () => {
  // store the transcript and selected language into variables
  const transcript = document.getElementById('transcript').value;
  const targetLanguage = targetLanguageSelect.value;

  if (!transcript) {
    alert('Please speak and generate a transcript first!');
    return;
  }
  console.log('Transcript:', transcript);
  console.log('TL:', targetLanguage);
  try {
    // send the transcript and selected language to the flask backend at the specified address (relative path)
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: transcript,
        targetLanguage: targetLanguage
      })
    });
// wait for response
    const data = await response.json();
    console.log('Translation data:', data);
    if (data.translation) { // if response is in the expected form
      translationOutput.value = data.translation; // output in the intended area
    } else if (data.error) {
      translationOutput.value = `Error: ${data.error}`;
    }
  } catch (error) {
    console.error('Translation error:', error);
    translationOutput.value = 'Failed to translate. Check console for details.';
  }
});

// Add audio playback functionality
playAudioButton.addEventListener('click', () => { 
  const translation = translationOutput.value;
  if (!translation) {
    alert('Please translate the text first!');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(translation);
  const selectedLanguage = targetLanguageSelect.value;

  // Match language codes to voices (add more mappings if needed)
  const languageMap = {
    English: 'en-US',
    Spanish: 'es-ES',
    French: 'fr-FR',
    German: 'de-DE',
    Chinese: 'zh-CN'
  };

  utterance.lang = languageMap[selectedLanguage] || 'en-US';
  speechSynthesis.speak(utterance);
});
