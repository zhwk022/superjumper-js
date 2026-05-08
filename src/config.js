export const WORLD_WIDTH = 10;
export const WORLD_HEIGHT = 15 * 20;
export const FRUSTUM_WIDTH = 10;
export const FRUSTUM_HEIGHT = 15;
export const GRAVITY = { x: 0, y: -12 };
export const STORAGE_KEY = "superjumper_settings_v1";

export const BOB = { width: 0.8, height: 0.8, jumpVelocity: 11, moveVelocity: 20 };
export const PLATFORM = { width: 2, height: 0.5, velocity: 2, pulverizeTime: 0.8 };
export const COIN = { width: 0.5, height: 0.8, score: 10 };
export const SPRING = { width: 0.3, height: 0.3 };
export const SQUIRREL = { width: 1, height: 0.6, velocity: 3 };
export const CASTLE = { width: 1.7, height: 1.7 };

export const APP = { menu: "menu", help: "help", highscores: "highscores", game: "game", winStory: "win_story" };
export const GAME = { ready: "ready", running: "running", paused: "paused", over: "over", win: "win" };

export const UI = { w: 320, h: 480, scale: 1, x: 0, y: 0 };

export const atlas = {
  mainMenu: [0, 224, 300, 110],
  pauseMenu: [224, 128, 192, 96],
  ready: [320, 224, 192, 32],
  gameOver: [352, 256, 160, 96],
  highTitle: [0, 257, 300, 33],
  logo: [0, 352, 274, 142],
  soundOff: [0, 0, 64, 64],
  soundOn: [64, 0, 64, 64],
  arrow: [0, 64, 64, 64],
  pause: [64, 64, 64, 64],
  spring: [128, 0, 32, 32],
  castle: [128, 64, 64, 64],
  coin: [
    [128, 32, 32, 32],
    [160, 32, 32, 32],
    [192, 32, 32, 32],
    [160, 32, 32, 32],
  ],
  bobJump: [
    [0, 128, 32, 32],
    [32, 128, 32, 32],
  ],
  bobFall: [
    [64, 128, 32, 32],
    [96, 128, 32, 32],
  ],
  bobHit: [128, 128, 32, 32],
  squirrel: [
    [0, 160, 32, 32],
    [32, 160, 32, 32],
  ],
  platform: [64, 160, 64, 16],
  breakPlatform: [
    [64, 160, 64, 16],
    [64, 176, 64, 16],
    [64, 192, 64, 16],
    [64, 208, 64, 16],
  ],
};

export const menuBounds = {
  sound: { x: 0, y: 0, w: 64, h: 64 },
  play: { x: 10, y: 218, w: 300, h: 36 },
  hs: { x: 10, y: 182, w: 300, h: 36 },
  help: { x: 10, y: 146, w: 300, h: 36 },
};

export const pauseBtn = { x: 256, y: 416, w: 64, h: 64 };
export const resumeBtn = { x: 64, y: 240, w: 192, h: 36 };
export const quitBtn = { x: 64, y: 204, w: 192, h: 36 };

export const winStoryMessages = [
  "Princess: Oh dear! What have you done?",
  "Bob: I came to rescue you!",
  "Princess: You are mistaken. I need no rescuing.",
  "Bob: So all this work for nothing?",
  "Princess: I have cake and tea! Would you like some?",
  "Bob: It would be my pleasure!",
  "And they ate cake and drank tea happily ever after.",
];
