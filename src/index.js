import * as Tone from 'tone';
import { Accidental, Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import './styles.css';


// Add event listener for play button to play a C major scale as a demo
document.addEventListener('DOMContentLoaded', function() {
  const playBtn = document.getElementById('play-btn');
  const instrumentSelect = document.getElementById('instrument-select');
  const bpmInput = document.getElementById('bpm-input');
  const loopCheckbox = document.getElementById('loop-playback');
  let loopInterval = null;
  const stopBtn = document.getElementById('stop-btn');

  function stopLoopPlayback() {
    if (loopInterval) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
    // Also stop all currently playing notes
    if (Tone && Tone.Transport) {
      Tone.Transport.stop();
    }
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopLoopPlayback);
  }

  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      stopLoopPlayback(); // Stop any existing loop before starting new playback
      await Tone.start(); // Required for browser autoplay policy
      let synth;
      const selectedInstrument = instrumentSelect ? instrumentSelect.value : 'Synth';
      switch (selectedInstrument) {
        case 'AMSynth':
          synth = new Tone.AMSynth().toDestination();
          break;
        case 'FMSynth':
          synth = new Tone.FMSynth().toDestination();
          break;
        case 'DuoSynth':
          synth = new Tone.DuoSynth().toDestination();
          break;
        case 'MonoSynth':
          synth = new Tone.MonoSynth().toDestination();
          break;
        case 'MembraneSynth':
          synth = new Tone.MembraneSynth().toDestination();
          break;
        case 'MetalSynth':
          synth = new Tone.MetalSynth().toDestination();
          break;
        case 'PluckSynth':
          synth = new Tone.PluckSynth().toDestination();
          break;
        case 'PolySynth':
          synth = new Tone.PolySynth().toDestination();
          break;
        default:
          synth = new Tone.Synth().toDestination();
      }
      // Try to get the current tone row from the last rendering, or generate a new one if not available
      let toneRow = window.currentToneRow;
      if (!toneRow) {
        toneRow = generateToneRow();
      }
      // Map the tone row to octave 4 notes for playback (e.g., C4, C#4, D4, ...)
      const notes = toneRow.map(n => n.replace('b', '♭').replace('#', '#') + '4').map(n => n.replace('♭', 'b'));
      // Get BPM from input, default to 120 if not set
      let bpm = 120;
      if (bpmInput && bpmInput.value) {
        bpm = parseInt(bpmInput.value, 10) || 120;
      }
      const beatDuration = 60 / bpm; // seconds per beat

      // Function to play the sequence
      const playSequence = () => {
        let now = Tone.now();
        notes.forEach((note, i) => {
          synth.triggerAttackRelease(note, "8n", now + i * beatDuration);
        });
      };

      // If loop is checked, set interval, else play once
      if (loopCheckbox && loopCheckbox.checked) {
        playSequence();
        loopInterval = setInterval(playSequence, notes.length * beatDuration * 1000);
      } else {
        playSequence();
      }
    });
  }
});

// Function to generate a random Schoenberg tone row
function generateToneRow() {
  const notes = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  ];
  const toneRow = [];

  // Randomly shuffle the notes array to create a tone row
  while (notes.length > 0) {
    const randomIndex = Math.floor(Math.random() * notes.length);
    toneRow.push(notes.splice(randomIndex, 1)[0]); // Remove the selected note from the array
  }

  return toneRow; // Return the shuffled tone row
}

// Function to map notes to VexFlow keys based on accidental preference
function mapToVexFlowKeys(note, useFlats) {
  const sharpMap = {
    C: 'C/4',
    'C#': 'C#/4',
    D: 'D/4',
    'D#': 'D#/4',
    E: 'E/4',
    F: 'F/4',
    'F#': 'F#/4',
    G: 'G/4',
    'G#': 'G#/4',
    A: 'A/4',
    'A#': 'A#/4',
    B: 'B/4',
  };

  const flatMap = {
    C: 'C/4',
    Db: 'Db/4',
    D: 'D/4',
    Eb: 'Eb/4',
    E: 'E/4',
    F: 'E/4',
    Gb: 'Gb/4',
    G: 'G/4',
    Ab: 'Ab/4',
    A: 'A/4',
    Bb: 'Bb/4',
    B: 'B/4',
  };

  const enharmonicMap = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
  };

  if (useFlats && enharmonicMap[note]) {
    note = enharmonicMap[note]; // Convert sharps to flats
  }

  return (useFlats ? flatMap : sharpMap)[note] || 'C/4'; // Default to 'c/4' if the note is not found
}

// Function to render the tone row as sheet music
function renderToneRow(toneRow, clef, useFlats) {
  const div = document.getElementById('sheet-music');
  div.innerHTML = ''; // Clear previous rendering

  const renderer = new Renderer(div, Renderer.Backends.SVG);
  renderer.resize(900, 200);

  const context = renderer.getContext();
  const stave = new Stave(10, 40, 800);
  stave.addClef(clef).addTimeSignature('12/8').setContext(context).draw();

  // Map tone row to VexFlow notes
  const notes = toneRow.map((note) => {
    const key = mapToVexFlowKeys(note, useFlats);
    return new StaveNote({
      keys: [key],
      duration: '8', // Eighth note duration
    });
  });

  console.log('notes', notes)

  // Ensure the voice matches the time signature
  const voice = new Voice({ num_beats: 12, beat_value: 8 });
  voice.setMode(Voice.Mode.SOFT); // Allow flexibility in tick alignment
  voice.addTickables(notes);
  Accidental.applyAccidentals([voice], `C`);
  // Format and draw the voice
  const formatter = new Formatter();
  formatter.joinVoices([voice]).format([voice], 700);

  voice.draw(context, stave);
}

// Wait for the DOM to load before attaching the event listener
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('generate');
  const clefSelect = document.getElementById('clef-select');
  const accidentalToggle = document.getElementById('accidentals-toggle');

  button.addEventListener('click', () => {
    if (typeof stopLoopPlayback === 'function') stopLoopPlayback();
    const toneRow = generateToneRow();
    window.currentToneRow = toneRow; // Store the current tone row globally for playback
    const clef = clefSelect.value; // Get selected clef (treble or bass)
    const useFlats = accidentalToggle.checked; // Check if flats are preferred
    renderToneRow(toneRow, clef, useFlats);
  });
});