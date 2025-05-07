// timeUtils.ts

/**
 * Controls game time, including time progression and scaling.
 */

export class GameTime {
  private currentTime: number; // Current game time in milliseconds
  private timeScale: number; // Speed multiplier for game time

  constructor(initialTime: number = 0, timeScale: number = 1) {
    this.currentTime = initialTime;
    this.timeScale = timeScale;
  }

  /**
   * Advances the game time by a given delta (in real milliseconds).
   * @param delta Real time passed in milliseconds.
   */
  update(delta: number): void {
    this.currentTime += delta * this.timeScale;
  }

  /**
   * Sets the time scale multiplier.
   * @param scale The new time scale multiplier.
   */
  setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  /**
   * Gets the current game time.
   * @returns The current game time in milliseconds.
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Resets the game time to a specific value.
   * @param time The new game time in milliseconds.
   */
  resetTime(time: number = 0): void {
    this.currentTime = time;
  }
}

/**
 * Formats game time from seconds into a string representation.
 * @param seconds The game time in seconds.
 * @returns A formatted string in the format "MM:SS".
 */
export function formatGameTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}