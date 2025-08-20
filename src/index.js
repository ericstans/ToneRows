import { Accidental, Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import './styles.css';

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
    const toneRow = generateToneRow();
    const clef = clefSelect.value; // Get selected clef (treble or bass)
    const useFlats = accidentalToggle.checked; // Check if flats are preferred
    renderToneRow(toneRow, clef, useFlats);
  });
});