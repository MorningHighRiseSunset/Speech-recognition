//Initial References
const letterContainer = document.getElementById("letter-container");
const optionsContainer = document.getElementById("options-container");
const userInputSection = document.getElementById("user-input-section");
const newGameContainer = document.getElementById("new-game-container");
const newGameButton = document.getElementById("new-game-button");
const canvas = document.getElementById("canvas");
const resultText = document.getElementById("result-text");

let currentStreak = 0;
let highestScore = 0;


// Ensure the correct words list container exists only once
const correctWordsList = document.getElementById("correct-words-list") || createCorrectWordsList();

function createCorrectWordsList() {
  if (!document.getElementById("correct-words-list")) {
      const listContainer = document.createElement("div");
      listContainer.id = "correct-words-list";
      listContainer.className = "correct-words-container";
      listContainer.style.maxHeight = '600px'; // Ensure max-height is set
      listContainer.style.overflowY = 'auto'; // Ensure overflow is auto
      document.body.appendChild(listContainer);
      return listContainer;
  }
  return document.getElementById("correct-words-list");
}

let options = {
  "Normal Mode": 
  [
    { word: "fusible", definition: "Any substance that can be fused or melted."
    },
  ]
}

let winCount = 0;
let count = 0;

let chosenWord = "";
let chosenDefinition = "";

// Display option buttons
const displayOptions = () => {
  optionsContainer.innerHTML = ""; // Clear previous options
  let buttonCon = document.createElement("div");

  for (let value in options) {
    let button = document.createElement("button");
    button.className = "options";
    button.textContent = value;
    button.addEventListener("click", () => {
      generateWord(value);
      optionsContainer.innerHTML = ""; // Clear options after click
    });
    buttonCon.appendChild(button);
  }

  optionsContainer.appendChild(buttonCon);
};

//Block all the Buttons
const blocker = () => {
  let optionsButtons = document.querySelectorAll(".options");
  let letterButtons = document.querySelectorAll(".letters");
  //disable all options
  optionsButtons.forEach((button) => {
    button.disabled = true;
  });

  //disable all letters
  letterButtons.forEach((button) => {
    button.disabled = true;
  });
  newGameContainer.classList.remove("hide");
};

let usedWords = []; // Array to store used words

const generateWord = (optionValue) => {
  let optionsButtons = document.querySelectorAll(".options");
  optionsButtons.forEach((button) => {
    if (button.innerText.toLowerCase() === optionValue) {
      button.classList.add("active");
    }
    button.disabled = true;
  });

  letterContainer.classList.remove("hide");
  userInputSection.innerText = "";

  let optionArray = options[optionValue];
  let randomWordObject;
  do {
    randomWordObject = optionArray[Math.floor(Math.random() * optionArray.length)];
  } while (usedWords.includes(randomWordObject.word));

  usedWords.push(randomWordObject.word); // Add the chosen word to the usedWords array

  chosenWord = randomWordObject.word.toUpperCase();
  chosenDefinition = randomWordObject.definition;

  // Create display item with spaces handled correctly
  let displayItem = chosenWord.split('').map(char => char === ' ' ? '<span class="space"> </span>' : '<span class="dashes">_</span>').join('');
  userInputSection.innerHTML = displayItem;
};

// Modify the initializer function to include speech recognition for each spoken letter and handle audio connectivity
const initializer = () => {
  winCount = 0;
  count = 0;
  usedWords = []; // Reset used words for a new game

  userInputSection.innerHTML = "";
  optionsContainer.innerHTML = "";
  letterContainer.classList.add("hide");
  newGameContainer.classList.add("hide");
  letterContainer.innerHTML = "";

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ"; // English characters only initially
  for (let char of alphabet) {
    let button = document.createElement("button");
    button.classList.add("letters");
    button.innerText = char;
    button.addEventListener("click", letterButtonClickHandler);
    letterContainer.append(button);
  }

  displayOptions();
  let { initialDrawing } = canvasCreator();
  initialDrawing();

  // Speech recognition for each spoken letter
  let recognition = new webkitSpeechRecognition() || new SpeechRecognition();
  recognition.lang = 'en-US'; // Set the language for recognition

  recognition.onstart = function() {
    console.log('Speech recognition started.');
  };

  recognition.onerror = function(event) {
    if (event.error === 'no-speech') {
      alert('No speech detected. Please ensure your microphone is connected and working.');
    }
    if (event.error === 'audio-capture') {
      alert('No microphone detected. Please connect a microphone to use speech recognition.');
    }
  };

  recognition.onresult = function(event) {
    const spokenLetter = event.results[0][0].transcript.trim().toUpperCase();
    if (/^[A-Z]$/.test(spokenLetter)) { // Check if the spoken input is a letter
      simulateLetterKeyPress(spokenLetter);
    }
  };

  recognition.start();
};

// Letter button click handler
function letterButtonClickHandler() {
  let charArray = chosenWord.split("");
  let dashes = document.getElementsByClassName("dashes");
  if (charArray.includes(this.innerText)) {
    charArray.forEach((char, index) => {
      if (char === this.innerText) {
        dashes[index].innerText = char;
        winCount += 1;
        if (winCount == charArray.length) {
          resultText.innerHTML = `<h2 class='win-msg'>You Win!!</h2><p>The word was <span>${chosenWord}</span></p>`;
          blocker();
          showDefinitionPopup(chosenWord, chosenDefinition, true);
          currentStreak++;
          highestScore = Math.max(highestScore, currentStreak);
          document.getElementById('streak').innerText = `Current Streak: ${currentStreak}`;
        }
      }
    });
  } else {
    count += 1;
    drawMan(count);
    if (count == 6) {
      resultText.innerHTML = `<h2 class='lose-msg'>You Lose!!</h2><p>The word was <span>${chosenWord}</span></p>`;
      blocker();
      showDefinitionPopup(chosenWord, chosenDefinition, false);
      currentStreak = 0;
     document.getElementById('streak').innerText = `Current Streak: ${currentStreak}`;
    }
  }
  this.disabled = true;
}

function playRandomSound(sounds, duration) {
  const randomIndex = Math.floor(Math.random() * sounds.length);
  const audio = new Audio(sounds[randomIndex]);
  audio.play();
  audio.addEventListener('timeupdate', function() {
    if (audio.currentTime > duration) { // Change duration to the desired duration in seconds
      audio.pause();
    }
  });
}

function showDefinitionPopup(word, definition, isWin) {
  const color = isWin ? "green" : "red";
  const newListItem = document.createElement("li");
  newListItem.innerHTML = `<strong style="color: ${color};">${word}</strong>: ${definition}`;
  const list = document.getElementById("correct-words-list") || createCorrectWordsList();
  list.prepend(newListItem);

  if (isWin) {
    const winSounds = ['yeehaw-4-203840.mp3', '050612_wild-west-1-36194.mp3', 'tada-fanfare-a-6313.mp3', 'correct-6033.mp3']; // Add your win sound file names
    playRandomSound(winSounds, 4); // Adjust the duration here
  } else {
    const loseSounds = ['buzzer-or-wrong-answer-20582.mp3', 'the-only-harmonica-in-the-west-33942.mp3', 'lose-sound3.mp3']; // Add your lose sound file names
    playRandomSound(loseSounds, 7); // Adjust the duration here
  }
}

// Canvas drawing functions
const canvasCreator = () => {
  let context = canvas.getContext("2d");
  context.beginPath();
  context.strokeStyle = "#000";
  context.lineWidth = 5;

  const drawLine = (fromX, fromY, toX, toY) => {
    context.moveTo(fromX, fromY - 5); // Moved up by 5 pixels (less than before)
    context.lineTo(toX, toY - 5); // Moved up by 5 pixels (less than before)
    context.stroke();
  };

  const head = () => {
    context.beginPath();
    context.arc(70, 25, 10, 0, Math.PI * 2, true); // Moved up by 5 pixels (less than before)
    context.stroke();
  };

  const body = () => {
    drawLine(70, 35, 70, 75); // Adjusted coordinates (less upward shift)
  };

  const leftArm = () => {
    drawLine(70, 45, 50, 65); // Adjusted coordinates (less upward shift)
  };

  const rightArm = () => {
    drawLine(70, 45, 90, 65); // Adjusted coordinates (less upward shift)
  };

  const leftLeg = () => {
    drawLine(70, 75, 50, 105); // Adjusted coordinates (less upward shift)
  };

  const rightLeg = () => {
    drawLine(70, 75, 90, 105); // Adjusted coordinates (less upward shift)
  };

  const initialDrawing = () => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    drawLine(10, 125, 130, 125); // Moved up by 5 pixels (less than before)
    drawLine(10, 15, 10, 126); // Adjusted coordinates (less upward shift)
    drawLine(10, 15, 70, 15); // Same as before, less upward shift
    drawLine(70, 15, 70, 15); // Moved up by 5 pixels (less than before)
  };

  return { initialDrawing, head, body, leftArm, rightArm, leftLeg, rightLeg };
};

// Draw the man based on the count
const drawMan = (count) => {
  let { head, body, leftArm, rightArm, leftLeg, rightLeg } = canvasCreator();
  switch (count) {
    case 1:
      head();
      break;
    case 2:
      body();
      break;
    case 3:
      leftArm();
      break;
    case 4:
      rightArm();
      break;
    case 5:
      leftLeg();
      break;
    case 6:
      rightLeg();
      break;
    default:
      break;
  }
};

//New Game
newGameButton.addEventListener("click", initializer);
window.onload = initializer;

// script.js


// Modify the letterButtonClickHandler function to include a check for the solve command
function letterButtonClickHandler() {
  let inputChar = this.innerText;
  if (inputChar === "SOLVE") { // Assuming "SOLVE" is the command to solve the game
    solveWord();
    return; // Stop further execution
  }

  let charArray = chosenWord.split("");
  let dashes = document.getElementsByClassName("dashes");
  if (charArray.includes(inputChar)) {
    charArray.forEach((char, index) => {
      if (char === inputChar) {
        dashes[index].innerText = char;
        winCount += 1;
        if (winCount == charArray.length) {
          resultText.innerHTML = `<h2 class='win-msg'>You Win!!</h2><p>The word was <span>${chosenWord}</span></p>`;
          blocker();
          showDefinitionPopup(chosenWord, chosenDefinition, true);
          currentStreak++;
          highestScore = Math.max(highestScore, currentStreak);
          document.getElementById('streak').innerText = `Current Streak: ${currentStreak}`;
        }
      }
    });
  } else {
    count += 1;
    drawMan(count);
    if (count == 6) {
      resultText.innerHTML = `<h2 class='lose-msg'>You Lose!!</h2><p>The word was <span>${chosenWord}</span></p>`;
      blocker();
      showDefinitionPopup(chosenWord, chosenDefinition, false);
      currentStreak = 0;
      document.getElementById('streak').innerText = `Current Streak: ${currentStreak}`;
    }
  }
  this.disabled = true;
}

// Object to track the state of keys
const keysPressed = {
  Control: false,
  Q: false
};

// Function to solve the game
function solveWord() {
  const dashes = document.getElementsByClassName("dashes"); 
  chosenWord.split("").forEach((char, index) => {
    dashes[index].innerText = char;
  });
  blocker(); // Disable further interactions
  resultText.innerHTML = `<h2 class='win-msg'>Solved!</h2><p>The word was <span>${chosenWord}</span></p>`;
  showDefinitionPopup(chosenWord, chosenDefinition, true);
}

// Event listener for keydown
document.addEventListener('keydown', function(event) {
  if (event.key === 'Control' || event.key === 'q') {
    keysPressed[event.key] = true;
  }

  // Check if the specific combination is pressed
  if (keysPressed['Control'] && keysPressed['q']) {
    event.preventDefault(); // Prevent default actions
    solveWord(); // Solve the game
  }
});

// Event listener for keyup
document.addEventListener('keyup', function(event) {
  if (event.key === 'Control' || event.key === 'q') {
    keysPressed[event.key] = false;
  }
});
