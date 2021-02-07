
// Note this code isn't supposed to be pretty, I'm just learning a new API

// The root of all WebAudio apps - the AudioContext 
const AudioContext = window.AudioContext || window.webkitAudioContext; 
const audioCtx = new AudioContext();

let wave = audioCtx.createPeriodicWave(wavetables.saw.real, wavetables.saw.imag);

let attackTime = 0.2;
let releaseTime = 0.5;
let pulseHz = 880;
let pulseLFO = 30;
let noiseDuration = 1;
let bandpassFrquency = 1000;

let sampleSource;

let attackControl; 
let releaseControl;

let osc;
let sawEnv;
let startTime;
let endTime;

let pulseWave;
let noise;

let samplePlaying = false;
let samplePlaybackRate = 1;

window.onload = function() {
    // we're using event delegation to capture these values
    document.addEventListener('input', function(e) {
        if(e.target.matches('#attack')) {
            attackTime = Number(e.target.value);
            console.log(`Attack time set to: ${attackTime}`);
        } else if(e.target.matches('#release')) {
            releaseTime = Number(e.target.value);
            console.log(`Release time set to: ${releaseTime}`);
        } else if(e.target.matches('#hz')) {
            pulseHz = Number(e.target.value);
            console.log(`Pulse Hz set to: ${pulseHz}`);
        } else if(e.target.matches('#lfo')) {
            pulseLFO = Number(e.target.value);
            console.log(`Pulse LFO set to: ${pulseLFO}`);
        } else if(e.target.matches('#duration')) {
            noiseDuration = Number(e.target.value);
            console.log(`Noise duration set to: ${noiseDuration}`);
        } else if(e.target.matches('#band')) {
            bandpassFrquency = Number(e.target.value);
            console.log(`Bandpass frequency set to: ${bandpassFrquency}`);
        } else if(e.target.matches('#rate')) {
            samplePlaybackRate = Number(e.target.value);
            console.log(`Sample playback rate set to: ${samplePlaybackRate}`);
        } 
    });
}

function playPulse() {
    pulseWave = audioCtx.createOscillator();
    pulseWave.type = 'sine';
    pulseWave.frequency.value = pulseHz;

    let amp = audioCtx.createGain();
    amp.gain.setValueAtTime(1, audioCtx.currentTime);

    let lfo = audioCtx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = pulseLFO;   

    lfo.connect(amp.gain);
    pulseWave.connect(amp).connect(audioCtx.destination);

    // order matters 
    lfo.start();
    pulseWave.start();
}

function stopPulse() {
    pulseWave.stop(audioCtx.currentTime);
}

function playSaw() {
    startTime = audioCtx.currentTime;

    osc = audioCtx.createOscillator();

    osc.setPeriodicWave(wave);
    osc.frequency.value = 200;

    sawEnv = audioCtx.createGain();
    sawEnv.gain.cancelScheduledValues(audioCtx.currentTime);
    sawEnv.gain.setValueAtTime(0, audioCtx.currentTime);

    // set the attack 
    sawEnv.gain.linearRampToValueAtTime(1, audioCtx.currentTime + attackTime);

    // connect to the output channel 
    osc.connect(sawEnv).connect(audioCtx.destination);

    osc.start();
    //osc.stop(audioCtx.currentTime + sawLength);
}

function stopSaw() {
    endTime = audioCtx.currentTime;

    sawEnv.gain.linearRampToValueAtTime(0, endTime + releaseTime);

    setTimeout(function() {
        osc.stop(endTime);
    }, releaseTime * 1000);
}

function playNoise() {
    const bufferSize = audioCtx.sampleRate * noiseDuration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

    let data = buffer.getChannelData(0);

    // noise in sound is just random data
    for(let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    let bandpass = audioCtx.createBiquadFilter(); // supports lowpass, highpass, and bandpass filters; use IIRFilterNode for more advanced and custom stuff 
    bandpass.type = 'bandpass'; 
    bandpass.frequency.value = bandpassFrquency;

    noise.connect(bandpass).connect(audioCtx.destination);
    noise.start();
}

function stopNoise() {
    noise.stop(audioCtx.currentTime);
}

async function loadSample(path) {
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    const sample = await audioCtx.decodeAudioData(arrayBuffer);

    console.log('Loading sample');

    return sample;
}

function toggleSample() {
    if(samplePlaying) {
        sampleSource.stop(audioCtx.currentTime);

        samplePlaying = false;
    } else {
        let sample = loadSample('./HOME - Resonance.mp3');

        sample.then(function(loadedSample) {
            sampleSource = audioCtx.createBufferSource();
            sampleSource.buffer = loadedSample;
            sampleSource.playbackRate.setValueAtTime(samplePlaybackRate, audioCtx.currentTime);

            sampleSource.connect(audioCtx.destination);
            sampleSource.start();

            samplePlaying = true;

            return sampleSource;
        });
    }
}