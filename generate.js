const fs = require('fs');
const path = require('path');
const ical = require('ical-generator').default;
const { addDays } = require('date-fns');
const SunCalc = require('suncalc');

const maramatakaPhases = [
  { name: 'Whiro', energy: 'Low', action: 'Rest', description: 'Lowest energy day. A time for rest, introspection, and planning.', moon: '🌑' },
  { name: 'Tirea', energy: 'Low', action: 'Plan', description: 'Energy is slowly returning. Gentle preparation.', moon: '🌒' },
  { name: 'Ohoata', energy: 'Medium', action: 'Plan', description: 'Energy is building. Good for starting small tasks.', moon: '🌒' },
  { name: 'Oue', energy: 'Medium', action: 'Act', description: 'Productive day. Energy continues to increase.', moon: '🌒' },
  { name: 'Okoro', energy: 'High', action: 'Act', description: 'An excellent day for important work and gathering.', moon: '🌒' },
  { name: 'Tamatea a ngana', energy: 'Medium', action: 'Act', description: 'Unpredictable energy. Proceed with caution.', moon: '🌓' },
  { name: 'Tamatea a hotu', energy: 'Medium', action: 'Act', description: 'Unpredictable weather and energy.', moon: '🌓' },
  { name: 'Tamatea a whio', energy: 'Medium', action: 'Act', description: 'Varying energy. Stay grounded.', moon: '🌓' },
  { name: 'Tamatea kai ariki', energy: 'Low', action: 'Rest', description: 'A difficult day. Better to observe and rest.', moon: '🌓' },
  { name: 'Huna', energy: 'Low', action: 'Rest', description: 'Things are hidden. Not a good day for seeking.', moon: '🌔' },
  { name: 'Ariro', energy: 'Medium', action: 'Plan', description: 'A quiet day. Good for light tasks.', moon: '🌔' },
  { name: 'Mawharu', energy: 'High', action: 'Act', description: 'A very favorable day for all activities.', moon: '🌔' },
  { name: 'Maurea', energy: 'High', action: 'Act', description: 'Good for connecting with others and important work.', moon: '🌔' },
  { name: 'Atua', energy: 'Low', action: 'Rest', description: 'A tricky day, energy is strange. Be careful.', moon: '🌔' },
  { name: 'Ohua', energy: 'High', action: 'Act', description: 'Moon is becoming full. Favorable for planting and productivity.', moon: '🌔' },
  { name: 'Turu', energy: 'High', action: 'Act', description: 'Energy is at its peak. Gathering day.', moon: '🌕' },
  { name: 'Rākaunui', energy: 'High', action: 'Act', description: 'Peak energy. The full moon. Highly productive.', moon: '🌕' },
  { name: 'Rākaumatohi', energy: 'High', action: 'Act', description: 'Excellent day. Energy is still very strong.', moon: '🌕' },
  { name: 'Takirau', energy: 'Medium', action: 'Act', description: 'Energy is beginning to wane gently.', moon: '🌖' },
  { name: 'Oike', energy: 'Medium', action: 'Rest', description: 'A difficult day, energy dropping.', moon: '🌖' },
  { name: 'Korekore te whiwhia', energy: 'Low', action: 'Rest', description: 'A non-productive day. Energy is low.', moon: '🌖' },
  { name: 'Korekore te rawea', energy: 'Low', action: 'Rest', description: 'A barren day. Rest is essential.', moon: '🌗' },
  { name: 'Korekore piri ki ngā Tangaroa', energy: 'Low', action: 'Plan', description: 'Transitioning soon. Prepare for active days ahead.', moon: '🌗' },
  { name: 'Tangaroa a mua', energy: 'High', action: 'Act', description: 'An excellent day, highly productive.', moon: '🌗' },
  { name: 'Tangaroa a roto', energy: 'High', action: 'Act', description: 'A very good day for important tasks.', moon: '🌗' },
  { name: 'Tangaroa kiokio', energy: 'High', action: 'Act', description: 'A powerful day. Make use of the great energy.', moon: '🌗' },
  { name: 'Otāne', energy: 'High', action: 'Act', description: 'A highly productive and good day.', moon: '🌘' },
  { name: 'Orongonui', energy: 'High', action: 'Act', description: 'An exceptionally good and fruitful day.', moon: '🌘' },
  { name: 'Mauri', energy: 'Medium', action: 'Plan', description: 'Energy begins to draw inward. Finishing tasks.', moon: '🌘' },
  { name: 'Omutu', energy: 'Low', action: 'Rest', description: 'The ending of the cycle. Time to wrap up.', moon: '🌘' },
  { name: 'Mutuwhenua', energy: 'Low', action: 'Rest', description: 'The absolute end of the lunar cycle. Complete rest.', moon: '🌑' }
];

const energyEmoji = {
  High: '🟢',
  Medium: '🟡',
  Low: '🔴'
};

function generateCalendars() {
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const calFull = ical({ name: 'Maramataka (Full)' });
  const calEnergy = ical({ name: 'Maramataka (Energy Only)' });
  const calGuidance = ical({ name: 'Maramataka (Guidance)' });

  // Calibrate phase offsets based on a known authentic anchor date
  // User provided: Tuesday 31st March 2026 is Ohua (Index 14)
  const anchorDate = new Date("2026-03-31T12:00:00+13:00");
  const OhuaIndex = maramatakaPhases.findIndex(p => p.name === 'Ohua'); // 14
  const rawAnchorPhase = SunCalc.getMoonIllumination(anchorDate).phase;
  // Calculate offset so that the anchor maps cleanly inside the integer slice for Ohua
  const REQUIRED_PHASE_START = OhuaIndex / maramatakaPhases.length;
  // Shifting the phase slightly inside the cell so that standard daily iterations land cleanly inside
  const phaseOffset = REQUIRED_PHASE_START - rawAnchorPhase + (0.4 / maramatakaPhases.length);

  // Generate for 365 days starting from today to provide a full year calendar
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Calculate at noon for a consistent phase reading
  
  const jsonData = {};

  for (let i = 0; i < 365; i++) {
    const eventDate = addDays(today, i);
    const moonIllumination = SunCalc.getMoonIllumination(eventDate);
    const icalDate = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
    
    // Apply our calibration offset, wrap if it breaches [0, 1]
    let adjustedPhase = (moonIllumination.phase + phaseOffset) % 1.0;
    if (adjustedPhase < 0) adjustedPhase += 1.0;
    
    const phaseIndex = Math.floor(adjustedPhase * maramatakaPhases.length);
    const currentPhase = maramatakaPhases[phaseIndex];

    const fullTitle = `${currentPhase.moon} ${currentPhase.name} — ${currentPhase.energy} Energy`;
    const fullDesc = `${currentPhase.description}\n\nSuggested focus: ${currentPhase.action}\nEnergy Level: ${currentPhase.energy}\n\nNote: This is a supportive interpretation of maramataka.`;

    const energyTitle = `${energyEmoji[currentPhase.energy]} ${currentPhase.energy} Energy Day`;
    const energyDesc = `Energy Level: ${currentPhase.energy}`;

    const guidanceTitle = `🎯 Focus: ${currentPhase.action}`;
    const guidanceDesc = `Suggested action: ${currentPhase.action}`;

    calFull.createEvent({
      start: icalDate,
      allDay: true,
      summary: fullTitle,
      description: fullDesc,
    });

    calEnergy.createEvent({
      start: icalDate,
      allDay: true,
      summary: energyTitle,
      description: energyDesc,
    });

    calGuidance.createEvent({
      start: icalDate,
      allDay: true,
      summary: guidanceTitle,
      description: guidanceDesc,
    });
    
    // Store data for the JSON API
    const dateKey = icalDate.toISOString().split('T')[0];
    jsonData[dateKey] = {
      name: currentPhase.name,
      energy: currentPhase.energy,
      action: currentPhase.action,
      description: currentPhase.description,
      moon: currentPhase.moon
    };
  }

  fs.writeFileSync(path.join(publicDir, 'maramataka-data.json'), JSON.stringify(jsonData, null, 2));
  fs.writeFileSync(path.join(publicDir, 'maramataka-full.ics'), calFull.toString());
  fs.writeFileSync(path.join(publicDir, 'maramataka-energy.ics'), calEnergy.toString());
  fs.writeFileSync(path.join(publicDir, 'maramataka-guidance.ics'), calGuidance.toString());

  console.log('Successfully generated .ics files in /public folder.');
}

generateCalendars();
