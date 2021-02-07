
// note: this code isn't meant to be pretty, I'm just playing around with an API I've never used

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

let audioElement;
let track;
let playButton;
let gainNode;
let volumeControl;
let panner;
let pannerControl;

window.onload = function() {
    // grab the <audio> tag 
    audioElement = document.querySelector('audio');

    // create a source / input node in the audio routing graph
    track = audioContext.createMediaElementSource(audioElement);

    // create a GainNode to control audio gain (loudness)
    gainNode = audioContext.createGain();

    // connect the audio source to the GainNode, so we can control its volume 
    // before sending it out to an output 
    track.connect(gainNode);

    // create a StereoPannerNode which lets us pan sound left or right 
    // (There is a more generic, but powerful node called PannerNode which lets you
    // pan in any direction, but this suffices for the demo)
    const pannerOptions = {pan: 0};
    panner = new StereoPannerNode(audioContext, pannerOptions);

    // connect GainNode to the panner
    gainNode.connect(panner);

    // connect the panner to the output 
    panner.connect(audioContext.destination);

    setUpPlayPauseButton();

    audioElement.addEventListener('ended', () => {
        playButton.dataset.playing = 'false';
    });

    setUpVolumeSlider();

    setUpPannerSlider();
};

function setUpPlayPauseButton() {
    const playButton = document.querySelector('button');

    playButton.addEventListener('click', function() {
        if(audioContext.state === 'suspended') 
            audioContext.resume();
        
        if(this.dataset.playing === 'false') {
            audioElement.play();
            this.dataset.playing = 'true';
        } else if(this.dataset.playing === 'true') {
            audioElement.pause();
            this.dataset.playing = 'false';
        } else {
            alert(`UNKNOWN DATA SET VALUE: ${this.dataset.playing}`);
        }
    }, false);
}

function setUpVolumeSlider() {
    volumeControl = document.querySelector('#volume');

    volumeControl.addEventListener('input', function() {
        gainNode.gain.value = this.value;
    }, false);
}

function setUpPannerSlider() {
    pannerControl = document.querySelector('#panner');

    pannerControl.addEventListener('input', function() {
        panner.pan.value = this.value;
    }, false);
}